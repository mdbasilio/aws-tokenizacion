import axios, { AxiosError, AxiosResponse } from 'axios';
import { Agent } from 'https';

const axiosConfig = {
    headers: {
        'Content-Type': 'application/json',
    },
    httpsAgent: new Agent({ rejectUnauthorized: false, keepAlive: true }),
};


const verifyCardOcp = async (url: string, payload: any): Promise<any> => {
    // Registra el inicio de la solicitud en los registros
    console.log("Inicio Solicitud en OnPremise Verify Card");

    try {
        // Registra detalles de la solicitud
        console.log("Petición a URL", url);

        // Realiza la solicitud HTTP al servicio externo
        const response: AxiosResponse<any> = await axios.post(
            url, 
            payload, 
            { ...axiosConfig }
        );

        // Devuelve la respuesta del servicio
        return response.data;
    } catch (error) {
        // Manejo de errores
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            console.error('Error al hacer la solicitud:', axiosError.message);
            console.error('Código de estado:', axiosError.response?.status);
            console.error('Data de respuesta:', axiosError.response?.data);
        } else {
            console.error('Error inesperado:', error);
        }

        // Devuelve null en caso de error
        return null;
    } finally {
        // Registra el fin de la solicitud en los registros
        console.log("Fin Solicitud Medios");
    }
}

export default verifyCardOcp;