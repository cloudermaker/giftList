import axios, { AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

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
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors de la récupération du groupe.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }

    static async post(url: string, data?: any): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.post(url, data, { withCredentials: true });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`post: ${ex.message}`);
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
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
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors de la mise à jour.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }

    static async patch(url: string, data?: any): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.patch(url, data, { withCredentials: true });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`patch: ${ex.message}`);
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors du patch.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }

    static async delete(url: string, data?: any): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.delete(url, { 
                data,
                withCredentials: true 
            });
        } catch (ex: any) {
            // Si l'erreur contient une réponse du serveur (400, 500, etc.), la retourner
            // pour que le code appelant puisse gérer le message d'erreur
            if (ex.response) {
                return ex.response;
            }
            
            // Sinon, erreur réseau ou autre - afficher le Swal générique
            console.log(`delete: ${ex.message}`);
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors de la suppression.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }
}
