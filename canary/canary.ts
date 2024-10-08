import exp = require("constants");

const synthetics = require('@aws-cdk/aws-synthetics');

const canary = async function () {  
    await synthetics.executeHttpStep(
        "Verify API returns successful response",
        process.env.API_ENDPOINT,
    );
}

export const handler = async () => {
   return   await canary();
}