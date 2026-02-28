import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import {Pool} from "pg";
import * as dotenv from "dotenv";

dotenv.config();

// SQS
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

//RDS Postgres
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function processOrders() {
  console.log("Iniciando procesador de ordenes de la cafeteria");
  console.log(`Escuchando mensajes en SQS: ${QUEUE_URL}`);

  while (true) {
    try {
      const receiveCmd = new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 10, 
      });

      const { Messages } = await sqsClient.send(receiveCmd);

      if (Messages && Messages.length > 0) {
        for (const message of Messages) {
          const body = message.Body;
          const receiptHandle = message.ReceiptHandle;

          if (body && receiptHandle) {
            console.log(`\n Mensaje recibido: ${body}`);

            // Parsear
            const [coffeeType, timestamp] = body.split('|');

            if (!coffeeType || !timestamp) {
              console.error("Error: El formato del mensaje no es válido. Se esperaba <Tipo>|<Timestamp>");
              continue; 
            }

            // Insertar en RDS
            const insertQuery = `
              INSERT INTO coffee_orders (timestamp, coffee_type) 
              VALUES ($1, $2)
            `;
            
            await pool.query(insertQuery, [timestamp, coffeeType]);
            console.log(`Orden registrada en BD: ${coffeeType} creada a las ${timestamp}`);

            // Borrar el mensaje de SQS tras procesarlo exitosamente
            const deleteCmd = new DeleteMessageCommand({
              QueueUrl: QUEUE_URL,
              ReceiptHandle: receiptHandle,
            });
            
            await sqsClient.send(deleteCmd);
            console.log(`Mensaje eliminado de la cola SQS.`);
          }
        }
      }
    } catch (error) {
      console.error("Error durante el ciclo de procesamiento:", error);
      // Evitamos que el programa crashee por un error temporal de red o base de datos
      await new Promise(resolve => setTimeout(resolve, 5000)); 
    }
  }
}

// Aplicacion
processOrders().catch((err) => {
  console.error("Error fatal iniciando la aplicación:", err);
});