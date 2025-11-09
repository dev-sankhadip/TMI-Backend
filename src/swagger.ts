// Swagger configuration for the Node.js project
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';

const swaggerSpec = YAML.load(path.join(__dirname, '../swagger.yaml'));

export { swaggerUi, swaggerSpec };
