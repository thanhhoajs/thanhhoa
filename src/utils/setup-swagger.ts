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
        <title>ThanhHoa API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
        </head>
        <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
        <script>
            SwaggerUIBundle({
            url: '${fullPath}/swagger.json',  // Use the full path including /api prefix
            dom_id: '#swagger-ui',
            });
        </script>
        </body>
        </html>
    `;
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  });
};
