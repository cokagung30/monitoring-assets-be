import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import * as admin from "firebase-admin";


@Injectable()
export class FirebaseService implements OnModuleInit {
    private readonly logger = new Logger(FirebaseService.name)
    private db: admin.firestore.Firestore;

    async onModuleInit() {
        try {
            if (!admin.apps.length) {
                const serviceAccount = {
                    type: 'service_account',
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
                    token_uri: 'https://oauth2.googleapis.com/token',
                    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
                    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                };

                admin.initializeApp({
                    credential: admin.credential.cert(
                        serviceAccount as admin.ServiceAccount
                    ),
                    projectId: process.env.FIREBASE_PROJECT_ID,
                });

                this.logger.log('Firebase Admin SDK initialized successfully');
            }

            this.db = admin.firestore();
            this.logger.log('Firestore database connection established');
        } catch (error) {
            this.logger.error('Firebase initialization error', error);
            throw error;
        }
    }

    async createDocument(collection: string, data: any, docId?: string): Promise<string> {
        try {
            const docRef = docId 
                ? this.db.collection(collection).doc(docId)
                : this.db.collection(collection).doc();

            await docRef.set({
                ...data,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            this.logger.log(`Document createf in ${collection} with ID: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            this.logger.error(`Error creating document in ${collection}`, error);
            throw error;
        }
    }

    async getDocument(collection: string, docId: string): Promise<any> {
        try {
            const docRef = this.db.collection(collection).doc(docId);
            const doc = await docRef.get();

            if (!doc.exists) {
                return null;
            }
            
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            this.logger.error(`Error getting document ${docId} from ${collection}`, error);
            throw error;
        }
    }

    async updateDocument(collection: string, docId: string, data: any): Promise<any> {
        try {
            const docRef = this.db.collection(collection).doc(docId);
            await docRef.update({
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            this.logger.log(`Document ${docId} updated in ${collection}`);
        } catch (error) {
            this.logger.error(`Error updating document ${docId} in ${collection}`, error);
            throw error;
        }
    }

    async deleteDocument(collection: string, docId: string): Promise<void> {
        try {
            await this.db.collection(collection).doc(docId).delete();
            this.logger.log(`Document ${docId} deleted from ${collection}`);
        } catch (error) {
            this.logger.error(`Error deleting document ${docId} from ${collection}`, error);
            throw error;
        }
    }

    async getCollection(collection: string, limit?: number): Promise<any> {
        try {
            let query: admin.firestore.Query = this.db.collection(collection);

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const documents: any[] = [];

            snapshot.forEach(doc => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return documents;
        } catch (error) {
            this.logger.error(`Error getting collection ${collection}`, error);
            throw error;
        }
    }

    async queryDocuments(
        collection: string,
        field: string,
        operator: FirebaseFirestore.WhereFilterOp,
        value: any,
        limit?: number,
    ): Promise<any[]> {
        try {
            let query: admin.firestore.Query = this.db.collection(collection).where(field, operator, value);

            if (limit) {
                query = query.limit(limit);
            }

            const snapshot = await query.get();
            const documents: any[] = [];

            snapshot.forEach(doc => {
                documents.push({ id: doc.id, ...doc.data() });
            });

            return documents;
        } catch (error) {
            this.logger.error(`Error querying ${collection} with ${field} ${operator} ${value}`, error);
            throw error;
        }
    }
}