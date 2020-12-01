export interface IRequest {
    errorMessage: string;
    statusCode: number;
    startTime: string;
    duration: number;
    data: any;
    apiDesc: string;
}

export interface IRequestsData {
    apiDesc: string;
    failureRate: string;
    failureCount: number
    requestCount: number;
    averageDuration: number;
    requests: IRequest[];
    isSecondRowCollapsed: boolean;
}

export class NetworkDebugger {
    public stopRecordingRequests = false;
    public overall = {
        apiDesc: "overall",
        failureRate: "",
        failureCount: 0,
        requestCount: 1,
        averageDuration: 0,
        requests: [],
        isSecondRowCollapsed: true
    };
    public maxRequests = 10;
    individualRequests: Record<string, IRequestsData> = {};
    public requestsMap: IRequestsData[] = [];

    addToArrayAndTrim<T>(list: T[], data: T, maxLength: number, onRemoval = (item: T) => null, onAddition = (item: T) => null) {
        if (list.length >= maxLength) {
            const r = list.splice(this.maxRequests - 1, 1);
            onRemoval(r[0]);
        }

        list.splice(0, 0, data);
        onAddition(data);
    }

    addRequest(data: IRequest) {
        if (this.stopRecordingRequests) {
            return;
        }
        //add to overall list
        const individualRequests = this.individualRequests[data.apiDesc] || {
            apiDesc: data.apiDesc,
            failureRate: "",
            failureCount: 0,
            requestCount: 1,
            averageDuration: 0,
            requests: [],
            isSecondRowCollapsed: true
        } as IRequestsData;

        this.addToArrayAndTrim(individualRequests.requests, data, this.maxRequests,
            (item) => {
                if (item.errorMessage) {
                    individualRequests.failureCount--;
                }
            },
            (item) => {
                if (item.errorMessage) {
                    individualRequests.failureCount++;
                }
                individualRequests.failureRate = (individualRequests.failureCount / individualRequests.requests.length * 100).toFixed(0) + "%";

                individualRequests.averageDuration = +(individualRequests.requests.reduce((sum, request) => sum += request.duration, 0) / individualRequests.requests.length).toFixed(0);

            })

        individualRequests.requestCount = individualRequests.requests.length;

        this.individualRequests[data.apiDesc] = individualRequests;

        if (individualRequests.requestCount === 1) {
            this.requestsMap.push(individualRequests)
        }

        this.addToArrayAndTrim(this.overall.requests, data, this.maxRequests,
            (item) => {
                if (item.errorMessage) {
                    this.overall.failureCount--;
                }
            },
            (item) => {
                if (item.errorMessage) {
                    this.overall.failureCount++;
                }
                this.overall.failureRate = (this.overall.failureCount / this.overall.requests.length * 100).toFixed(0) + "%";

                this.overall.averageDuration = +(this.overall.requests.reduce((sum, request) => sum += request.duration, 0) / this.overall.requests.length).toFixed(0);

            })

        console.log(this.overall, this.individualRequests, this.requestsMap)
    }
}