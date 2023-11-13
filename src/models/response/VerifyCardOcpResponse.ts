import { CardType } from "../enums/CardType";
import { ResponseOcp } from "./ResponseOcp";


export interface VerifyCardOcpResponse extends ResponseOcp<Data> {
    //metadata?: any;
}

interface Data {
    consumerId: string;
    accountId: string;
    tipoTarjeta: CardType;
    card: Card;
    datosCliente: Client;
}


interface Card {
    lostOrStolen: boolean,
    expired: boolean,
    invalid: boolean,
    fraudSuspect: boolean
}

interface Client {
    nombreCliente: string;
    apellidoCliente: string;
    fechaNacimiento: string;
    title: string;
    direccion: string;
    email: string;
    pais: string;
    ciudad: string;
    celular: string;
}