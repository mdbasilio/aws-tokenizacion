export const handler = async function (event: any) {
    
    // Accede a los pathParameters para obtener el valor de consumerId
    const consumerId = event.pathParameters.consumerId;

    // Ahora puedes utilizar consumerId en tu lógica de Lambda
    console.log(`El valor de consumerId es: ${consumerId}`);

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/json" },
        body: JSON.stringify({ message: "Hello from Lambda consumer_information!" })
    };
};