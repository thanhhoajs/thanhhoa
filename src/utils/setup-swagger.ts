import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';

/**
 * Sets up Swagger UI and JSON spec routes for the given ThanhHoa app.
 *
 * @param {ThanhHoa} app - The ThanhHoa app to set up the routes for.
 * @param {string} docsRoute - The route to use for serving Swagger UI and JSON spec.
 * @param {object} swaggerSpec - The Swagger spec JSON object to serve at the above route.
 */
export const setupSwagger = (
  app: ThanhHoa,
  docsRoute: string,
  swaggerSpec: object,
) => {
  // Get the full path including prefix for the client-side URL
  const fullPath = `${app.getPrefix()}${docsRoute}`;

  // Route for serving Swagger JSON spec
  app.get(`${docsRoute}/swagger.json`, async (context: IRequestContext) => {
    return new Response(JSON.stringify(swaggerSpec), {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // Route for serving Swagger UI
  app.get(docsRoute, async (context: IRequestContext) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="API documentation for ThanhHoa Framework">
    <title>ThanhHoa API Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background: #f8f9fa;
        }
        #swagger-ui {
            max-width: 1460px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
            background: white;
        }
        .swagger-ui .topbar {
            background: linear-gradient(135deg, #ffd700, #ffb300);
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .swagger-ui .info {
            margin: 30px 0;
        }
        .swagger-ui .info .title {
            font-size: 36px;
            font-weight: 600;
            color: #1a237e;
        }
        .swagger-ui .scheme-container {
            margin: 0;
            padding: 30px;
            background: #ffffff;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-radius: 8px;
        }
        .swagger-ui .opblock {
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: none;
            margin: 0 0 15px;
        }
        .swagger-ui .opblock .opblock-summary {
            padding: 15px;
        }
        .swagger-ui .opblock .opblock-summary-method {
            border-radius: 6px;
            font-weight: 600;
        }
        .swagger-ui .btn {
            border-radius: 6px;
            font-weight: 500;
            text-transform: none;
            transition: all 0.2s;
        }
        .swagger-ui select {
            border-radius: 6px;
        }
        .swagger-ui input[type=text] {
            border-radius: 6px;
        }
        .swagger-ui textarea {
            border-radius: 6px;
        }
        .swagger-ui .response-col_status {
            font-weight: 600;
        }
        .swagger-ui table tbody tr td {
            padding: 15px 10px;
        }
        .swagger-ui .responses-table .response {
            padding: 15px;
        }
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            body {
                background: #1a1a1a;
            }
            #swagger-ui {
                background: #242424;
            }
            .swagger-ui .info .title {
                color: #90caf9;
            }
            .swagger-ui .scheme-container {
                background: #2d2d2d;
            }
            .swagger-ui .opblock {
                background: #333;
            }
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({
                url: '${fullPath}/swagger.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                displayRequestDuration: true,
                filter: true,
                withCredentials: true,
                docExpansion: 'none',
                tagsSorter: 'alpha',
                operationsSorter: 'alpha',
                persistAuthorization: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                syntaxHighlight: {
                    activated: true,
                    theme: "nord"
                },
                requestInterceptor: (req) => {
                    const el = document.querySelector('#swagger-ui');
                    el.style.opacity = '0.5';
                    req.loadingStartTime = new Date();
                    return req;
                },
                responseInterceptor: (res) => {
                    const el = document.querySelector('#swagger-ui');
                    el.style.opacity = '1';
                    return res;
                }
            });
        };
    </script>
</body>
</html>`;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  });
};
