import axios, { AxiosResponse } from 'axios';
import Swal from 'sweetalert2';

export default class AxiosWrapper {
    static async get(url: string): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.get(url);
        } catch (ex) {
            console.log(`get: ${(ex as any).message}`);
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
        } catch (ex) {
            console.log(`post: ${(ex as any).message}`);
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
        } catch (ex) {
            console.log(`put: ${(ex as any).message}`);
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
        } catch (ex) {
            console.log(`patch: ${(ex as any).message}`);
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors du patch.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }

    static async delete(url: string): Promise<AxiosResponse<any, any> | undefined> {
        try {
            return await axios.delete(url, { withCredentials: true });
        } catch (ex) {
            console.log(`delete: ${(ex as any).message}`);
            Swal.fire(
                'Erreur',
                "Désolé, une erreur imprévue est arrivée lors de la suppression.\r\nVeuillez prévenir l'équipe de développement.",
                'error'
            );
        }
    }
}
