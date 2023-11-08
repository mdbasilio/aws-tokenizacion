export interface ConsumerInformation {
    language?: string,
    firstName: string,
    middleName?: string,
    lastName: string,
    dateOfBirth: string,
    title?: string,
    email?:string,
    mobilePhoneNumber: MobilePhoneNumber,
    residencyAddress: ResidencyAddress
}


interface MobilePhoneNumber {
    countryCode: string,
    phoneNumber: string    
}

interface ResidencyAddress {
    line1: string,
    line2?: string,
    city?:  string,
    state?: string,
    zipCode: string,
    countryCode: string
}