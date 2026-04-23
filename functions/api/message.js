export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const formData = await request.formData();

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();
    const token = String(formData.get("cf-turnstile-response") || "").trim();

    if (!name || !message) {
      return json({ ok: false, error: "缺少必填字段。" }, 400);
    }

    if (name.length > 60 || email.length > 120 || message.length > 1000) {
      return json({ ok: false, error: "输入内容超出长度限制。" }, 400);
    }

    if (!token) {
      return json({ ok: false, error: "请先完成人机验证。" }, 400);
    }

    if (!env.TURNSTILE_SECRET_KEY) {
      return json({ ok: false, error: "服务端未配置 Turnstile 密钥。" }, 500);
    }

    const ip =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("x-forwarded-for") ||
      "";

    const verifyBody = new URLSearchParams();
    verifyBody.append("secret", env.TURNSTILE_SECRET_KEY);
    verifyBody.append("response", token);
    if (ip) verifyBody.append("remoteip", ip);

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: verifyBody,
      }
    );

    const verifyData = await verifyRes.json();

    if (!verifyData.success) {
      return json(
        {
          ok: false,
          error: "人机验证失败，请刷新后重试。",
          details: verifyData["error-codes"] || [],
        },
        400
      );
    }

    const userAgent = request.headers.get("user-agent") || "";
    const referer = request.headers.get("referer") || "";
    const createdAt = new Date().toISOString();

    await env.MESSAGES_DB.prepare(
      `INSERT INTO messages (name, email, message, ip, user_agent, referer, created_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
      .bind(
        name,
        email || null,
        message,
        ip || null,
        userAgent || null,
        referer || null,
        createdAt
      )
      .run();

    return json({ ok: true });
  } catch (error) {
    return json(
      {
        ok: false,
        error: "服务器处理留言时出错。",
        detail: error instanceof Error ? error.message : String(error),
      },
      500
    );
  }
}

export async function onRequestGet() {
  return json({ ok: false, error: "Method Not Allowed" }, 405);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}
