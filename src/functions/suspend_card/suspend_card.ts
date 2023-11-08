export const handler = async function (event: any) {

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/json" },
        body: JSON.stringify({ message: "Hello from Lambda suspend_card!" })
    };
};