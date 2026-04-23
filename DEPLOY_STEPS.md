# Cloudflare Pages 留言功能部署说明

## 文件说明
- `index.html`：已经在“联系方式”里“下载简历”按钮下方加入留言表单。
- `functions/api/message.js`：Cloudflare Pages Functions 接口，接收留言、校验 Turnstile、写入 D1。
- `db/schema.sql`：D1 数据库建表语句。

## 你需要做的事情

### 1. 创建 D1 数据库
在 Cloudflare Dashboard 中创建一个 D1 数据库，例如：
- 数据库名：`portfolio-messages`

### 2. 执行建表 SQL
把 `db/schema.sql` 的内容粘贴到 D1 的 SQL 控制台执行。
你也可以用 Wrangler：
```bash
npx wrangler d1 execute portfolio-messages --remote --file=./db/schema.sql
```

### 3. 给 Pages 项目绑定 D1
进入你的 Pages 项目：
- Settings
- Bindings
- Add
- D1 database

绑定名请填写：
- `MESSAGES_DB`

然后重新部署。

### 4. 创建 Turnstile
在 Cloudflare Turnstile 中新建一个站点，并拿到：
- Site Key
- Secret Key

### 5. 配置前端 site key
打开 `index.html`，把下面这一项替换成你自己的 Site Key：
```html
data-sitekey="YOUR_TURNSTILE_SITE_KEY"
```

### 6. 配置服务端 secret key
在 Pages 项目中添加 Secret：
- Settings
- Variables and Secrets
- Add variable

名称填写：
- `TURNSTILE_SECRET_KEY`

值填写你的 Turnstile Secret Key。

然后重新部署。

### 7. 上传 Functions 文件
把 `functions/api/message.js` 放到你的项目仓库里，确保部署时被 Pages 识别。

### 8. 查看留言
这个方案不会在网页前台展示留言。
你可以通过以下两种方式查看：

#### 方式 A：Cloudflare 后台
进入 D1 数据库，直接查看 `messages` 表里的记录。

#### 方式 B：Wrangler 查询
```bash
npx wrangler d1 execute portfolio-messages --remote --command "SELECT id, name, email, message, created_at FROM messages ORDER BY id DESC;"
```

## 可选增强
- 给留言增加邮箱通知
- 增加 IP 频率限制
- 增加“已读/未读”后台管理页
- 用 Cloudflare Access 给管理页加访问保护
