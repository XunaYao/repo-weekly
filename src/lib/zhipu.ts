const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const DEFAULT_MODEL = "glm-4.7-flash";

type ZhipuMessage = {
  role: "system" | "user";
  content: string;
};

type ZhipuRequest = {
  messages: ZhipuMessage[];
  temperature?: number;
};

type ZhipuResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export type ZhipuErrorCode =
  | "ZHIPU_NOT_CONFIGURED"
  | "ZHIPU_AUTH_ERROR"
  | "ZHIPU_UNAVAILABLE"
  | "ZHIPU_API_ERROR"
  | "MODEL_RESPONSE_INVALID";

export class ZhipuApiError extends Error {
  constructor(
    readonly code: ZhipuErrorCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function getZhipuFailure(response: Response, payload: ZhipuResponse) {
  const providerMessage = payload.error?.message ?? "Zhipu API request failed";
  const normalizedMessage = providerMessage.toLowerCase();
  const isUnavailable =
    response.status === 429 ||
    response.status >= 500 ||
    ["访问量过大", "稍后再试", "繁忙", "busy", "overloaded"].some((keyword) =>
      normalizedMessage.includes(keyword),
    );

  if (response.status === 401 || response.status === 403) {
    return new ZhipuApiError("ZHIPU_AUTH_ERROR", "智谱 API 身份验证失败", 502);
  }

  if (isUnavailable) {
    return new ZhipuApiError("ZHIPU_UNAVAILABLE", "智谱模型当前繁忙，请稍后再试", 503);
  }

  return new ZhipuApiError("ZHIPU_API_ERROR", providerMessage, 502);
}

export async function requestZhipuContent({
  messages,
  temperature = 0,
}: ZhipuRequest): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY;

  if (!apiKey) {
    throw new ZhipuApiError(
      "ZHIPU_NOT_CONFIGURED",
      "ZHIPU_API_KEY is not configured",
      500,
    );
  }

  const response = await fetch(ZHIPU_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ZHIPU_MODEL ?? DEFAULT_MODEL,
      temperature,
      response_format: { type: "json_object" },
      messages,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as ZhipuResponse;

  if (!response.ok) {
    throw getZhipuFailure(response, payload);
  }

  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new ZhipuApiError(
      "MODEL_RESPONSE_INVALID",
      "智谱模型返回了空内容",
      502,
    );
  }

  return content;
}
