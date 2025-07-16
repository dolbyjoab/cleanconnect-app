// AWS Lambda function to create a new service request in DynamoDB

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require('uuid'); // For generating unique IDs

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Lambda handler function
exports.handler = async (event) => {
    console.log("Received event:", JSON.stringify(event, null, 2));

    // Ensure the request body exists
    if (!event.body) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*", // Allow CORS for frontend
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Request body is missing." }),
        };
    }

    let requestData;
    try {
        requestData = JSON.parse(event.body);
    } catch (error) {
        console.error("Error parsing request body:", error);
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Invalid JSON in request body." }),
        };
    }

    // Basic validation for required fields (expand as needed)
    if (!requestData.customerName || !requestData.serviceType || !requestData.location) {
        return {
            statusCode: 400,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Missing required fields: customerName, serviceType, location." }),
        };
    }

    const requestId = uuidv4(); // Generate a unique ID for the request
    const timestamp = new Date().toISOString(); // Current timestamp

    const params = {
        TableName: process.env.TABLE_NAME || "AyaCleaningServiceRequests", // Get table name from environment variable
        Item: {
            requestId: requestId,
            customerName: requestData.customerName,
            serviceType: requestData.serviceType,
            location: requestData.location,
            status: "Pending", // Initial status
            createdAt: timestamp,
            updatedAt: timestamp,
            // Add more fields as per your requirements (e.g., scheduledTime, cleanerId)
        },
    };

    try {
        await docClient.send(new PutCommand(params));
        console.log("Service request created successfully:", requestId);
        return {
            statusCode: 201, // 201 Created
            headers: {
                "Access-Control-Allow-Origin": "*", // Important for CORS
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Service request created successfully.",
                requestId: requestId,
                status: "Pending"
            }),
        };
    } catch (error) {
        console.error("Error creating service request:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: "Failed to create service request.", error: error.message }),
        };
    }
};