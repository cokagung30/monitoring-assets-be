export interface Asset {
    id?: string;
    type: string;
    name: string;
    document?: string;
    village?: string;
    subdistrict?: string;
    wide?: number;
    dateAggrement?: Date;
    beforeUse?: string;
    afterUse?: string;
    information?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}