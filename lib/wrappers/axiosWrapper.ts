import axios, { AxiosResponse } from 'axios';

// sweetalert2 chargé à la demande : sinon il embarque ~40 kB dans le bundle de chaque page
const showNetworkError = async (text: string): Promise<void> => {
    const { default: Swal } = await import('sweetalert2');
    Swal.fire('Erreur', text, 'error');
};

export default class AxiosWrapper {
    static async get(url: string): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.get(url);
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`get: ${ex.message}`);
            showNetworkError("Désolé, une erreur imprévue est arrivée lors de la récupération du groupe.\r\nVeuillez prévenir l'équipe de développement.");
        }
    }

    static async post(url: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.post(url, data, { withCredentials: true, headers });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`post: ${ex.message}`);
            showNetworkError("Désolé, une erreur imprévue est arrivée.\r\nVeuillez prévenir l'équipe de développement.");
        }
    }

    static async put(url: string, data?: any): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.put(url, data, { withCredentials: true });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`put: ${ex.message}`);
            showNetworkError("Désolé, une erreur imprévue est arrivée lors de la mise à jour.\r\nVeuillez prévenir l'équipe de développement.");
        }
    }

    static async patch(url: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.patch(url, data, { withCredentials: true, headers });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`patch: ${ex.message}`);
            showNetworkError("Désolé, une erreur imprévue est arrivée lors du patch.\r\nVeuillez prévenir l'équipe de développement.");
        }
    }

    static async delete(url: string, data?: any, headers?: Record<string, string>): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.delete(url, {
                data,
                withCredentials: true,
                headers
            });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            // pour que le code appelant puisse gérer le message d'erreur
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`delete: ${ex.message}`);
            showNetworkError("Désolé, une erreur imprévue est arrivée lors de la suppression.\r\nVeuillez prévenir l'équipe de développement.");
        }
    }
}
