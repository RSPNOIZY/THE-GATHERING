# Linking MySQL as a source - Docs

The MySQL connector can link your database tables to PostHog.

To link MySQL:

1.  Go to the [Data pipeline page](https://app.posthog.com/data-management/sources) and the sources tab in PostHog
2.  Click **New source** and select MySQL
3.  Enter your database connection details:
    -   **Host:** The hostname or IP your database server like `db.example.com` or `123.132.1.100`.
    -   **Port:** The port your database server is listening to. The default is `3306`.
    -   **Database:** The name of the database you want like `analytics_db`.
    -   **User:** The username with the necessary permissions to access the database.
    -   **Password:** The password for the user.
    -   **Schema:** The schema for your database where your tables are located. The default is `public`.
    -   **Use SSL:** Whether to use SSL for the connection. Default is enabled.
4.  If you need to connect through an SSH tunnel, enable and configure it (optional):
    -   **Tunnel host:** The hostname of your SSH server.
    -   **Tunnel port:** The port your SSH server is listening on.
    -   **Authentication type:**
        -   For password authentication, enter your SSH username and password.
        -   For key-based authentication, enter your SSH username, private key, and optional passphrase.
5.  Click **Next**

The data warehouse then starts syncing your MySQL data. You can see details and progress in the [sources tab](https://app.posthog.com/data-management/sources).

## Configuration

| Option | Type | Required |
| --- | --- | --- |
| Host | text | Yes |
| Port | number | Yes |
| Database | text | Yes |
| User | text | Yes |
| Password | password | Yes |
| Schema | text | No |
| Use SSL? | select | Yes |
| Use SSH tunnel? | ssh-tunnel | No |

**Decimal precision limits**

Numeric or decimal columns with values exceeding a precision of 76 or scale of 32 cannot be synced. If your sync fails with this error, you have three options:

-   Constrain the column with a lower precision/scale
-   Cast it to text in a view
-   Round the values at the source

#### Inbound IP addresses

We use a set of IP addresses to access your instance. To ensure this connector works, add these IPs to your inbound security rules:

| US | EU |
| --- | --- |
| 44.205.89.55 | 3.75.65.221 |
| 52.4.194.122 | 18.197.246.42 |
| 44.208.188.173 | 3.120.223.253 |

### Community questions

Ask a question

### Was this page useful?

HelpfulCould be better