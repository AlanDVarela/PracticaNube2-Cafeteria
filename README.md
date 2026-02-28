# PracticaNube2-Cafeteria

## Descripción
Este repositorio contiene el código fuente de un *worker* (consumidor) desarrollado en TypeScript y Node.js. Su objetivo es resolver el problema de saturación de pedidos en una cafetería durante las horas pico (ej. 12:00 pm). 

Para evitar el colapso del sistema y la pérdida de órdenes, se implementó una arquitectura asíncrona: los pedidos se reciben y retienen en una cola de mensajes (**Amazon SQS**). Esta aplicación, ejecutándose en un servidor en la nube (**Amazon EC2**), realiza un *polling* continuo para extraer los mensajes, procesarlos y registrarlos de forma íntegra en una base de datos relacional (**Amazon RDS** con PostgreSQL).

## Arquitectura y Tecnologías
* **Lenguaje:** TypeScript / Node.js
* **Mensajería:** Amazon SQS (Simple Queue Service)
* **Cómputo:** Amazon EC2 (Ubuntu)
* **Almacenamiento:** Amazon RDS (PostgreSQL)
* **SDK:** `@aws-sdk/client-sqs` (AWS SDK v3)

## Esquema de Base de Datos
El sistema espera que la base de datos PostgreSQL cuente con la siguiente tabla preconfigurada:

```sql
CREATE TABLE coffee_orders (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    coffee_type VARCHAR(50) NOT NULL,
    order_status VARCHAR(20) NOT NULL DEFAULT 'created'
);
