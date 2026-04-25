---
title: CCL Examples
description: Real-world CCL configuration examples.
---

These examples show common CCL configuration patterns.

## Database Configuration

```ccl
database =
  host = localhost
  port = 5432
  name = myapp_prod
  /= Read the named environment variable in your application.
  credentials =
    username = admin
    password_env = DATABASE_PASSWORD
```

## Multi-Environment Config

```ccl
beta =
  mode = sandbox
  capacity = 2
  feature_flags =
    new_ui = true
    api_v2 = false

prod =
  mode = live
  capacity = 8
  feature_flags =
    new_ui = false
    api_v2 = true
```

## Server List

```ccl
servers =
  = web1.example.com
  = web2.example.com
  = api.example.com

backup_servers =
  = backup1.example.com
  = backup2.example.com
```

## Nested Configuration

```ccl
logging =
  level = info
  outputs =
    console =
      enabled = true
      format = json
    file =
      enabled = true
      path = /var/log/app.log
      rotation = daily
```

## Comments and Documentation

```ccl
/= Application configuration
/= Document changes near the setting they explain.

app =
  name = MyApp
  version = 2.0.0
  /= Deprecated: Use feature_flags instead
  experimental_mode = false
```

All examples use core CCL syntax: key-value pairs, empty-key lists, comments, and indentation.
