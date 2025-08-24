export class ClientError {
    public status: number;
    public message: string;

    public constructor(status: number, message: string) {
        this.status = status;
        this.message = message;
    }
}

export class InvalidData extends ClientError {
    public constructor(id: string) {
        super(422, `component of item '${id}' is not of expected type: 'ObjectId'`);
    }
}

export class SubsubjectNotFound extends ClientError {
    public constructor(subsubject: string) {
        super(404, `subsubject "${subsubject}}" not found`);
    }
}

export class RouteNotFound extends ClientError {
    public constructor(route: string) {
        super(404, `route ${route} not found`);
    }
}

export class UnauthorizedError extends ClientError {
    public constructor(message: string) {
        super(401, message);
    }
}

export class ForbiddenError extends ClientError {
    public constructor(message: string) {
        super(403, message);
    }
}