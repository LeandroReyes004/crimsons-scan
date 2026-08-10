import re

with open('worker/src/index.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_query = """          const { webhook_discord, discord_template, telegram_chat_id } = await request.json();
          await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ?, telegram_chat_id = ? WHERE id = ?')
            .bind(webhook_discord || null, discord_template || null, telegram_chat_id || null, editWebhook[1]).run();"""
new_query = """          const { webhook_discord, discord_template, telegram_chat_id, telegram_template } = await request.json();
          await env.DB.prepare('UPDATE scans SET webhook_discord = ?, discord_template = ?, telegram_chat_id = ?, telegram_template = ? WHERE id = ?')
            .bind(webhook_discord || null, discord_template || null, telegram_chat_id || null, telegram_template || null, editWebhook[1]).run();"""

code = code.replace(old_query, new_query)

with open('worker/src/index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("DB query updated successfully!")
