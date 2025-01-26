import { ThanhHoa, type IRequestContext } from '@thanhhoajs/thanhhoa';
import { Controller, Get } from '../decorators/decorators';

@Controller()
class SwaggerController {
  constructor(
    private swaggerSpec: object,
    private basePath: string,
  ) {}

  @Get('/swagger.json')
  async getSwaggerJson(context: IRequestContext): Promise<Response> {
    return new Response(JSON.stringify(this.swaggerSpec), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  @Get('/')
  async getSwaggerUI(context: IRequestContext): Promise<Response> {
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
        :root {
            --primary-color: #ffd700;
            --secondary-color: #ffb300;
            --text-color: #2d3748;
            --background-light: #ffffff;
            --background-dark: #1a1a1a;
            --border-color: #e2e8f0;
            --border-dark: #404040;
            --box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            --transition-speed: 0.3s;
        }

        * {
            transition: background-color var(--transition-speed) ease,
                      color var(--transition-speed) ease,
                      border-color var(--transition-speed) ease,
                      box-shadow var(--transition-speed) ease;
        }

        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', sans-serif;
            background: #f8f9fa;
            transition: all 0.3s ease;
            -webkit-font-smoothing: antialiased;
        }
        #swagger-ui {
            max-width: 1460px;
            margin: 0 auto;
            padding: 20px;
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
            background: var(--background-light);
        }
        .swagger-ui .topbar {
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            padding: 15px 0;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .swagger-ui .info {
            margin: 30px 0;
        }
        .swagger-ui .info .title {
            font-size: 36px;
            font-weight: 600;
            color: var(--text-color);
        }
        .swagger-ui .scheme-container {
            margin-top: 60px; /* Add space below logo */
            padding: 30px;
            background: var(--background-light);
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
            border-radius: 12px;
        }
        .swagger-ui .opblock {
            border-radius: 12px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            border: none;
            margin: 0 0 15px;
            transition: all 0.3s ease;
        }
        .swagger-ui .opblock:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .swagger-ui .opblock .opblock-summary {
            padding: 20px;
        }
        .swagger-ui .opblock .opblock-summary-method {
            border-radius: 8px;
            font-weight: 600;
            min-width: 100px;
            text-align: center;
        }
        .swagger-ui .btn {
            border-radius: 8px;
            font-weight: 500;
            text-transform: none;
            transition: all 0.2s;
            cursor: pointer;
        }
        .swagger-ui .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .swagger-ui select,
        .swagger-ui input[type=text],
        .swagger-ui textarea {
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            padding: 8px 12px;
        }
        /* Dark mode enhancements */
        @media (prefers-color-scheme: dark) {
            body {
                background: var(--background-dark);
                color: #e2e8f0;
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
            .swagger-ui .opblock:hover {
                background: #383838;
            }
            .swagger-ui select,
            .swagger-ui input[type=text],
            .swagger-ui textarea {
                background: #2d2d2d;
                border-color: #404040;
                color: #e2e8f0;
            }
            .swagger-ui * {
                color: #e2e8f0;
            }
            .swagger-ui .opblock .opblock-summary-description {
                color: #a0aec0;
            }
        }
        /* Enhanced mobile responsiveness */
        @media (max-width: 768px) {
            body {
                font-size: 14px;
            }
            #swagger-ui {
                padding: 10px;
            }
            .swagger-ui .wrapper {
                padding: 0;
            }
            .swagger-ui .scheme-container {
                margin: 0;
                padding: 15px;
            }
            .swagger-ui .opblock {
                margin: 0 0 10px;
                padding: 8px;
            }
            .swagger-ui .opblock .opblock-summary {
                padding: 10px;
            }
            .swagger-ui .opblock .opblock-summary-method {
                min-width: 80px;
                padding: 6px 0;
            }
            .swagger-ui .parameters-container {
                padding: 10px;
            }
            .swagger-ui table tbody td {
                padding: 8px 5px;
            }
            .swagger-ui .response-col_status {
                font-size: 12px;
            }
            .swagger-ui .responses-table td {
                padding: 10px 5px;
            }
            .swagger-ui .info .title {
                font-size: 24px;
            }
            .swagger-ui .btn {
                padding: 8px 12px;
            }
            .swagger-ui select,
            .swagger-ui input[type=text],
            .swagger-ui textarea {
                font-size: 14px;
                padding: 6px 8px;
            }
        }

        /* Small mobile devices */
        @media (max-width: 480px) {
            .swagger-ui .opblock-summary-description {
                margin: 0;
                padding-top: 8px;
                clear: both;
            }
            .swagger-ui .opblock .opblock-section-header {
                flex-direction: column;
                align-items: flex-start;
                padding: 8px;
            }
            .swagger-ui .opblock .opblock-section-header > .tab-header {
                margin: 0 0 8px 0;
            }
        }

        /* Theme Toggle */
        .theme-toggle {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            background: var(--background-light);
            border-radius: 50px;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
        }

        .theme-toggle button {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            padding: 5px;
            border-radius: 50%;
            transition: transform 0.3s ease;
        }

        .theme-toggle button:hover {
            transform: rotate(45deg);
        }

        body.dark-theme {
            background: var(--background-dark);
            color: #e2e8f0;
        }

        body.dark-theme #swagger-ui {
            background: #242424;
        }

        body.dark-theme .swagger-ui * {
            color: #e2e8f0;
        }

        body.dark-theme .swagger-ui .info .title {
            color: var(--primary-color);
        }

        body.dark-theme .swagger-ui .opblock {
            background: #333;
            border: 1px solid var(--border-dark);
        }

        body.dark-theme .swagger-ui .opblock:hover {
            background: #383838;
            border-color: var(--primary-color);
        }

        body.dark-theme .swagger-ui .opblock-tag {
            border-bottom: 1px solid var(--border-dark);
        }

        body.dark-theme .swagger-ui .parameter__name,
        body.dark-theme .swagger-ui .parameter__type {
            color: #90caf9;
        }

        body.dark-theme .swagger-ui .btn {
            background: #404040;
            color: #e2e8f0;
        }

        body.dark-theme .swagger-ui .btn:hover {
            background: #505050;
        }

        body.dark-theme .swagger-ui select,
        body.dark-theme .swagger-ui input[type=text],
        body.dark-theme .swagger-ui textarea {
            background: #2d2d2d;
            border-color: var(--border-dark);
            color: #e2e8f0;
        }

        body.dark-theme .swagger-ui .model-toggle:after {
            background: url("data:image/svg+xml;charset=utf-8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='%23fff' d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'/></svg>") center center no-repeat;
        }

        /* Enhanced Response Section */
        body.dark-theme .swagger-ui .responses-wrapper,
        body.dark-theme .swagger-ui .responses-inner {
            background: #2d2d2d;
        }

        body.dark-theme .swagger-ui .response-col_status {
            color: var(--primary-color);
        }

        body.dark-theme .swagger-ui .response-col_description__inner div {
            color: #e2e8f0;
        }

        /* Improved Table Styles */
        body.dark-theme .swagger-ui table tbody tr td {
            border-color: var(--border-dark);
            color: #e2e8f0;
        }

        body.dark-theme .swagger-ui .parameters-col_description {
            color: #a0aec0;
        }

        /* Schema Styles */
        body.dark-theme .swagger-ui section.models {
            border-color: var(--border-dark);
        }

        body.dark-theme .swagger-ui section.models h4 {
            color: var(--primary-color);
        }

        /* Loading Animation */
        #swagger-ui.loading {
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }

        .loading-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(4px);
            z-index: 9999;
            opacity: 0;
            transition: opacity var(--transition-speed) ease;
        }

        .loading-overlay.visible {
            opacity: 1;
        }

        .loading-spinner {
            width: 50px;
            height: 50px;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }

        .loading-spinner::before,
        .loading-spinner::after {
            content: '';
            position: absolute;
            border-radius: 50%;
            animation: pulse 1.8s ease-in-out infinite;
        }

        .loading-spinner::before {
            width: 100%;
            height: 100%;
            background: var(--primary-color);
            animation-delay: -0.5s;
        }

        .loading-spinner::after {
            width: 75%;
            height: 75%;
            background: var(--secondary-color);
            top: 12.5%;
            left: 12.5%;
        }

        @keyframes pulse {
            0%, 100% {
                transform: scale(0);
                opacity: 1;
            }
            50% {
                transform: scale(1);
                opacity: 0.25;
            }
        }

        /* Custom Loading Animation */
        .loading-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 9999;
        }

        .loading-spinner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 3px solid var(--primary-color);
            border-radius: 50%;
            border-top-color: transparent;
            animation: spin 1s linear infinite;
        }

        /* Enhanced Search Bar */
        .swagger-ui .search-wrapper {
            position: sticky;
            top: 0;
            z-index: 100;
            background: var(--background-light);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        /* Code Copy Button Base Styles */
        .copy-button {
            position: absolute;
            top: 5px;
            right: 5px;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            opacity: 0;
            transition: all 0.3s ease;
            font-size: 12px;
            font-weight: 500;
            background: rgba(255, 215, 0, 0.2);
            color: var(--text-color);
            backdrop-filter: blur(4px);
        }

        .copy-button:hover {
            opacity: 1;
            transform: translateY(-1px);
            background: rgba(255, 215, 0, 0.3);
        }

        .swagger-ui pre:hover .copy-button {
            opacity: 0.9;
        }

        /* Dark Mode Copy Button */
        body.dark-theme .copy-button {
            background: rgba(255, 215, 0, 0.15);
            color: var(--primary-color);
            border: 1px solid rgba(255, 215, 0, 0.2);
        }

        body.dark-theme .copy-button:hover {
            background: rgba(255, 215, 0, 0.25);
            border-color: var(--primary-color);
            box-shadow: 0 0 10px rgba(255, 215, 0, 0.1);
        }

        body.dark-theme .swagger-ui pre .copy-button {
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        /* Copy Button Success State */
        .copy-button.copied {
            background: rgba(72, 187, 120, 0.2) !important;
            color: #48bb78 !important;
            border-color: #48bb78 !important;
        }

        /* Response Visualization */
        .response-viz {
            margin-top: 10px;
            padding: 15px;
            border-radius: 8px;
            background: var(--background-light);
        }

        .response-chart {
            width: 100%;
            height: 200px;
            margin-top: 10px;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        /* Enhanced Dark Mode Styles */
        body.dark-theme {
            /* Authorization Section */
            .swagger-ui .authorization__btn {
                color: var(--primary-color);
                border-color: var(--border-dark);
            }

            .swagger-ui .auth-wrapper {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            .swagger-ui .auth-container {
                color: #e2e8f0;
            }

            .swagger-ui .auth-btn-wrapper {
                background: #333;
            }

            /* Route Descriptions */
            .swagger-ui .opblock-description-wrapper p,
            .swagger-ui .opblock-external-docs-wrapper p,
            .swagger-ui .opblock-title_normal p {
                color: #a0aec0;
            }

            /* Parameters Section */
            .swagger-ui .parameters-container {
                background: #2d2d2d;
                border-radius: 8px;
            }

            .swagger-ui .parameters-col_name {
                color: var(--primary-color);
            }

            .swagger-ui .parameters-col_description {
                color: #e2e8f0;
            }

            .swagger-ui .parameter__name,
            .swagger-ui .parameter__type,
            .swagger-ui .parameter__deprecated,
            .swagger-ui .parameter__in {
                color: #90caf9;
            }

            .swagger-ui table thead tr td,
            .swagger-ui table thead tr th {
                color: var(--primary-color);
                border-color: var(--border-dark);
                background-color: #333;
            }

            /* Models Section */
            .swagger-ui section.models {
                border-color: var(--border-dark);
                background: #2d2d2d;
            }

            .swagger-ui section.models.is-open h4 {
                border-color: var(--border-dark);
            }

            .swagger-ui .model-container {
                background: #333;
            }

            .swagger-ui section.models .model-container {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            .swagger-ui .model {
                color: #e2e8f0;
            }

            .swagger-ui .model-title {
                color: var(--primary-color);
            }

            /* Schema Styles */
            .swagger-ui .prop-type {
                color: #90caf9;
            }

            .swagger-ui .prop-format {
                color: #a0aec0;
            }

            /* Try it out Section */
            .swagger-ui .try-out__btn {
                color: var(--primary-color);
                border-color: var(--border-dark);
            }

            .swagger-ui .try-out {
                border-color: var(--border-dark);
            }

            .swagger-ui .execute-wrapper {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            /* Response Section */
            .swagger-ui .responses-inner {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            .swagger-ui .response-col_status {
                color: var(--primary-color);
            }

            .swagger-ui .response-col_links {
                color: #90caf9;
            }

            /* Code Samples */
            .swagger-ui .microlight {
                background: #333 !important;
                color: #e2e8f0 !important;
            }

            /* Expand/Collapse Buttons */
            .swagger-ui .expand-methods svg,
            .swagger-ui .expand-operation svg {
                fill: var(--primary-color);
            }

            /* Authorize Modal */
            .swagger-ui .dialog-ux .modal-ux {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            .swagger-ui .dialog-ux .modal-ux-header {
                background: #333;
                border-color: var(--border-dark);
            }

            .swagger-ui .dialog-ux .modal-ux-content {
                background: #2d2d2d;
            }

            .swagger-ui .auth-container input[type=text],
            .swagger-ui .auth-container input[type=password] {
                background: #333;
                color: #e2e8f0;
                border-color: var(--border-dark);
            }

            /* Scopes Section */
            .swagger-ui .scopes h2 {
                color: var(--primary-color);
            }

            .swagger-ui .scope-def {
                color: #e2e8f0;
            }

            /* Additional Components */
            .swagger-ui .servers > label {
                color: #e2e8f0;
            }

            .swagger-ui .servers-title {
                color: var(--primary-color);
            }

            .swagger-ui select {
                background-color: #333;
                border-color: var(--border-dark);
                color: #e2e8f0;
            }

            /* Base Path & Host */
            .swagger-ui .base-url {
                color: #90caf9;
            }

            .swagger-ui .host-url {
                color: #a0aec0;
            }

            /* Authorization Button & Container Fixes */
            .swagger-ui .scheme-container {
                background: #2d2d2d;
                box-shadow: 0 1px 2px 0 rgba(0,0,0,.15);
            }

            .swagger-ui .auth-wrapper .authorize {
                border-color: var(--border-dark);
                background: rgba(255,255,255,0.1);
                color: var(--primary-color);
            }

            .swagger-ui .auth-container .authorize {
                border-color: var(--border-dark);
            }

            .swagger-ui .auth-wrapper .authorize svg {
                fill: var(--primary-color);
            }

            /* Summary & Description Fixes */
            .swagger-ui .opblock .opblock-summary-description,
            .swagger-ui .opblock-description-wrapper p,
            .swagger-ui .opblock-external-docs-wrapper p,
            .swagger-ui .opblock-title_normal p {
                color: #a0aec0 !important;
            }

            /* Parameters Section Enhancement */
            .swagger-ui .opblock-section-header {
                background-color: #2d2d2d;
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .swagger-ui .opblock-section-header h4 {
                color: var(--primary-color);
            }

            .swagger-ui .parameters-container .parameters-col_description {
                color: #e2e8f0;
            }

            .swagger-ui .parameter__name {
                color: var(--primary-color) !important;
            }

            .swagger-ui .parameter__type,
            .swagger-ui .parameter__deprecated,
            .swagger-ui .parameter__in {
                color: #90caf9 !important;
            }

            /* Authorization Details */
            .swagger-ui .authorization__btn {
                border: 1px solid var(--border-dark);
                background: rgba(255,255,255,0.1);
            }

            .swagger-ui .authorization__btn.unlocked {
                background: rgba(255,215,0,0.1);
            }

            .swagger-ui .auth-container .wrapper {
                background: #2d2d2d;
                border-color: var(--border-dark);
            }

            .swagger-ui .auth-container h4,
            .swagger-ui .auth-container h6,
            .swagger-ui .auth-container .wrapper ~ .wrapper:before {
                color: var(--primary-color);
            }

            /* Authorization Types */
            .swagger-ui .auth-container .wrapper:last-child {
                border-color: var(--border-dark);
            }

            .swagger-ui .auth-container .authorization__btn {
                background: #333;
                border-color: var(--border-dark);
                color: #e2e8f0;
            }

            .swagger-ui .auth-container .authorization__btn:hover {
                background: #404040;
            }

            /* Authentication Schemes */
            .swagger-ui .scheme-container .schemes > label {
                color: #e2e8f0;
            }

            .swagger-ui .scheme-container .schemes select {
                background: #333;
                color: #e2e8f0;
                border-color: var(--border-dark);
            }

            /* Headers and Labels */
            .swagger-ui .tab li button.tablinks,
            .swagger-ui .opblock-section-header > label {
                color: #e2e8f0;
            }

            /* No Parameters Message */
            .swagger-ui .opblock-description-wrapper p,
            .swagger-ui .no-margin {
                color: #a0aec0;
            }

            /* Scope Names and Descriptions */
            .swagger-ui .scope-name {
                color: var(--primary-color);
            }

            .swagger-ui .scopes h2,
            .swagger-ui .scope-def {
                color: #e2e8f0;
            }
        }

        /* Enhance Loading Animation */
        .loading-spinner {
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }
    </style>
</head>
<body>
    <div class="theme-toggle">
        <button id="theme-switch" aria-label="Toggle theme">🌓</button>
    </div>
    <div class="loading-overlay">
        <div class="loading-spinner"></div>
    </div>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js" crossorigin></script>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-standalone-preset.js" crossorigin></script>
    <script>
        window.onload = () => {
            // Theme Toggle Logic
            const themeSwitch = document.getElementById('theme-switch');
            const body = document.body;
            
            // Check for saved theme preference
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                body.classList.add(savedTheme);
                themeSwitch.textContent = savedTheme === 'dark-theme' ? '🌞' : '🌙';
            }

            themeSwitch.addEventListener('click', () => {
                body.classList.toggle('dark-theme');
                const isDark = body.classList.contains('dark-theme');
                themeSwitch.textContent = isDark ? '🌞' : '🌙';
                localStorage.setItem('theme', isDark ? 'dark-theme' : 'light-theme');
            });

            // Enhanced Swagger UI Configuration
            window.ui = SwaggerUIBundle({
                url: '${this.basePath}/swagger.json',
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
                    SwaggerUIBundle.plugins.DownloadUrl,
                    {
                        statePlugins: {
                            search: {
                                reducers: {
                                    UPDATE_SEARCH_QUERY: (state, action) => {
                                        // Enhanced search logic
                                        return state.set("searchQuery", action.payload)
                                    }
                                }
                            }
                        }
                    }
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                syntaxHighlight: {
                    activated: true,
                    theme: "nord"
                },
                requestInterceptor: (req) => {
                    const loadingOverlay = document.querySelector('.loading-overlay');
                    const swaggerUI = document.querySelector('#swagger-ui');
                    
                    loadingOverlay.style.display = 'block';
                    requestAnimationFrame(() => {
                        loadingOverlay.classList.add('visible');
                    });
                    swaggerUI.classList.add('loading');
                    
                    req.loadingStartTime = new Date();
                    return req;
                },
                responseInterceptor: (res) => {
                    const loadingOverlay = document.querySelector('.loading-overlay');
                    const swaggerUI = document.querySelector('#swagger-ui');
                    
                    loadingOverlay.classList.remove('visible');
                    setTimeout(() => {
                        loadingOverlay.style.display = 'none';
                        swaggerUI.classList.remove('loading');
                    }, 300);

                    // Add copy buttons to code blocks
                    setTimeout(() => {
                        document.querySelectorAll('pre').forEach(block => {
                            if (!block.querySelector('.copy-button')) {
                                const button = document.createElement('button');
                                button.className = 'copy-button';
                                button.textContent = 'Copy';
                                button.onclick = () => {
                                    navigator.clipboard.writeText(block.textContent);
                                    button.textContent = 'Copied!';
                                    setTimeout(() => button.textContent = 'Copy', 2000);
                                };
                                block.style.position = 'relative';
                                block.appendChild(button);
                            }
                        });
                    }, 100);

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
  }
}

export const setupSwagger = (
  app: ThanhHoa,
  docsRoute: string,
  swaggerSpec: object,
) => {
  // Create controller instance with the swagger spec
  @Controller(docsRoute)
  class ConfiguredSwaggerController extends SwaggerController {
    constructor() {
      const fullPath = `${app.getPrefix()}${docsRoute}`;
      super(swaggerSpec, fullPath);
    }
  }

  // Register the controller
  app.registerController(ConfiguredSwaggerController);
};
