# To-do Printer Backend

The printer queue is hosted inside the same Cloudflare Worker as `nicholasmedland.com` and stores jobs in a private D1 database. It does not add a public page to the portfolio.

## Endpoint

```text
https://nicholasmedland.com/api/todo-printer/index.php
```

The legacy-looking `index.php` path is intentional. It lets the existing iPhone Shortcut and Raspberry Pi worker use the new backend without code changes. The shorter `/api/todo-printer` path also works.

## Credentials

Two separate Bearer tokens protect the queue:

- `TODO_QUEUE_SUBMIT_TOKEN`: only for the iPhone Shortcut that adds tasks.
- `TODO_QUEUE_WORKER_TOKEN`: only for the Raspberry Pi that claims and finishes jobs.

The local copies are stored in the ignored `.env.local` file. Never commit that file or paste either token into public documentation.

## Raspberry Pi setting

Set `TODO_QUEUE_URL` to the endpoint above and `TODO_QUEUE_WORKER_TOKEN` to the worker token from `.env.local`. The supplied `queue_worker.py` can otherwise remain unchanged.

## iPhone Shortcut setting

Set the Shortcut URL to the endpoint above, choose the `submit` action, and use the submit token from `.env.local` as its Bearer token. The existing Shortcut instructions remain valid.

## API actions

All requests are `POST` requests with a JSON body and an `Authorization: Bearer …` header.

- `?action=submit` adds a task.
- `?action=claim` leases the oldest task to the Pi.
- `?action=complete` marks it printed and erases its task text.
- `?action=fail` releases or permanently fails it, depending on retry settings.

The queue supports duplicate-submit protection, expiring worker leases, retry limits, queue limits, and automatic cleanup of old finished records.
