import IApplicationResources from "../../common/IApplicationResources.interface";
import IRouter from "../../common/IRouter.interface";
import * as express from "express";
import AdministratorController from "./AdministratorController.controller";

class AdministratorRouter implements IRouter{
    public setupRoutes(application: express.Application, resources: IApplicationResources){

        const administratorController: AdministratorController = new AdministratorController (resources.services);
        
        application.get("/api/administrator",     administratorController.getAll.bind(administratorController));
        application.get("/api/administrator/:id", administratorController.getById.bind(administratorController));
    }
}

export default AdministratorRouter;