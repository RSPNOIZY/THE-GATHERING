# Linking BigQuery as a source - Docs

You can connect your BigQuery tables to PostHog by configuring it as a source. You must grant a limited set of permissions so the connector can create, query, and delete temporary tables without exposing your entire BigQuery environment.

## Requirements

-   [A Google Cloud Service Account](https://cloud.google.com/iam/docs/service-account-overview) with the permissions described below
-   Google Cloud JSON Key file for that account's Dataset ID
-   (Optional) A Dataset ID for temporary tables

## Configuring BigQuery

To securely connect your BigQuery account to PostHog, create a dedicated service account with the minimum required permissions:

1.  **Create a service account:**

-   Go to the [**Google Cloud Console.**](https://console.cloud.google.com/)
-   Navigate to **IAM & Admin > Service Accounts.**
-   Click **Create Service Account.**
-   Provide a descriptive name (e.g., `bigquery-posthog-service-account`) and a brief description.

2.  **Assign required permissions:**

-   For simplicity, you can assign the **BigQuery Data Editor**, **BigQuery Job User**, and **BigQuery Read Session User** roles if it meets your security requirements.

-   Alternatively, create a custom role that includes only these permissions:

    PostHog AI

    ```
    bigquery.readsessions.create
    bigquery.readsessions.getData
    bigquery.datasets.get
    bigquery.jobs.create
    bigquery.tables.get
    bigquery.tables.list
    bigquery.tables.getData
    bigquery.tables.create
    bigquery.tables.updateData
    bigquery.tables.delete
    ```

3.  **Generate and download the service account key:**

-   Once the service account is created, click on it and select the **Keys** tab.
-   Click **Add Key > Create new key**, choose **JSON**, and download the key file.
-   **Important:** Store the JSON key securely, as it contains sensitive credentials.

## Configuring PostHog

1.  In PostHog, go to the **[Data pipelines](https://app.posthog.com/data-management/sources)** tab, then choose **sources**
2.  Click **New source** and select BigQuery
3.  Drag and drop the **Google Cloud JSON Key file** to upload
4.  Enter the **Dataset ID** you want to import
5.  (Optional) If you're limiting permissions to the service account provided, enter a Dataset ID for temporary tables
6.  (Optional) Add a prefix for the table name

> In some rare instances BigQuery is unable to auto-locate your dataset unless you specify a region. If you see an error message that looks something like:
>
> `Dataset xxx:xxx was not found in region`
>
> then you may need to toggle the switch for manually specifying your region. Regions typically look like `us-east1` or similar.

## Configuration

| Option | Description |
| --- | --- |
| Google Cloud JSON key fileType: file-uploadRequired: True |
| Manually specify your dataset region?Type: switch-groupRequired: False | In most cases, BigQuery is able to automatically determine the region your dataset is located in. For the rare instances that BigQuery fails to do so, you can manually specify your dataset region here. |
| Dataset IDType: textRequired: True |
| Use a different dataset for the temporary tables?Type: switch-groupRequired: False | We have to create and delete temporary tables when querying your data, this is a requirement of querying large BigQuery tables. We can use a different dataset if you'd like to limit the permissions available to the service account provided. |
| Use a different project for the dataset than your service account project?Type: switch-groupRequired: False | If the dataset you're wanting to sync exists in a different project than that of your service account, use this to provide the project ID of the BigQuery dataset. |

## Supported tables

The tables available from this source are discovered from your account when you connect it, so the exact list depends on your data. Once connected, you can pick which tables to sync from the [sources tab](https://app.posthog.com/data-management/sources).

## How it works

PostHog creates and deletes [temporary tables](https://cloud.google.com/bigquery/docs/writing-results#temporary_and_permanent_tables) when querying your data. This is necessary for handling large BigQuery tables. Temporary tables help break down large data processing tasks into manageable chunks. However, they incur storage and query costs in BigQuery while they exist. We delete them as soon as the job is done.

PostHog requires a unique primary key when importing data and will look for it in this order:

1.  PostHog will use the `id` column as the primary key if it exists
2.  If the `id` column does not exist, PostHog will use any primary key constraints in the table

After selecting the primary key, PostHog will query the table to see if the column is unique. If it is not, PostHog will fail the import with a `DuplicatePrimaryKeysException`. If you have no `id` column and no primary key constraints, future incremental imports will fail.

### Costs

We minimize BigQuery costs by keeping queries to a minimum and deleting temporary tables immediately after use. Although the connector automates temporary table management, check [BigQuery’s pricing](https://cloud.google.com/bigquery/pricing) for details on storage and query costs.

## Troubleshooting

### Invalid Project ID or Dataset ID

If you see an error like:

> `Your BigQuery Project ID or Dataset ID contains characters BigQuery doesn't allow.`

This means the Project ID or Dataset ID you entered contains characters that BigQuery doesn't accept. BigQuery has strict naming rules:

-   **Project IDs** can only contain lowercase letters, digits, and hyphens.
-   **Dataset IDs** can only contain letters, digits, and underscores (no hyphens).

A common mistake is copying identifiers with extra characters like parentheses or spaces. Verify your Project ID and Dataset ID in the [Google Cloud Console](https://console.cloud.google.com/) and update your source configuration in PostHog.

### Community questions

Ask a question

### Was this page useful?

HelpfulCould be better