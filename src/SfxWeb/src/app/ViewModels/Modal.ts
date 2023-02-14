export interface IModalDataAdditionalParameter {
    resourceId?: string;
}

export interface IModalData {
    title: string,
    modalTitle?: string,
    modalMessage?: string,
    confirmationKeyword?: string
    additionalParam?: IModalDataAdditionalParameter
}