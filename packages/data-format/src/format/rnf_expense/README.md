# Expense format

| Name            | Type      | Need      | Comment                                |
| --------------- | --------- | --------- | -------------------------------------- |
| meta            | object    | Mandatory | see below "meta"                       |
| creationDate    | date-time | Mandatory | Creation date of the request           |
| periodStartDate | date-time | Mandatory | Starting period of the current expense |
| periodEndDate   | date-time | Mandatory | End period of the current expense      |
| employeeInfo    | object    | Mandatory | see below "employeeInfo"               |
| employerInfo    | object    | Mandatory | see below "employerInfo"               |
| expenseItems    | array     | Mandatory | see below "expenseItem"                |

## meta

_Information about the format of the json_

| Name    | Type     | Need      | Comment              |
| ------- | -------- | --------- | -------------------- |
| format  | constant | Mandatory | value: "rnf_expense" |
| version | constant | Mandatory | value: "0.1.0"       |

## employeeInfo

_Information about the employee_

| Name       | Type                     | Need      | Comment            |
| ---------- | ------------------------ | --------- | ------------------ |
| email      | string _(format: email)_ | Mandatory | email              |
| employeeId | string                   | Mandatory | id of the employee |
| firstName  | string                   | Mandatory | first name         |
| lastName   | string                   | Mandatory | last name          |

## employerInfo

_Information about the employer_

| Name                | Type                     | Need      | Comment                                                                                                          |
| ------------------- | ------------------------ | --------- | ---------------------------------------------------------------------------------------------------------------- |
| email               | string _(format: email)_ | Mandatory | email                                                                                                            |
| firstName           | string                   | Mandatory | first name                                                                                                       |
| lastName            | string                   | Mandatory | last name                                                                                                        |
| businessName        | string                   | Mandatory | business name                                                                                                    |
| phone               | string                   | Optional  | phone                                                                                                            |
| address             | object                   | Optional  | address formatted as [http://json-schema.org/address](http://json-schema.org/learn/examples/address.schema.json) |
| companyRegistration | string                   | Optional  | company registration                                                                                             |
| miscellaneous       | object                   | Optional  | Miscellaneous                                                                                                    |

## expenseItem

_List of the items of the expense_

| Name        | Type      | Need      | Comment                                    |
| ----------- | --------- | --------- | ------------------------------------------ |
| name        | string    | Mandatory | name of the item                           |
| quantity    | number    | Mandatory | quantity (minimum 1)                       |
| unitPrice   | string    | Mandatory | unit price (integer in currency base unit) |
| currency    | string    | Mandatory | currency                                   |
| expenseDate | date-time | Mandatory | date of the expense                        |
| category    | string    | Optional  | category                                   |
| reference   | string    | Optional  | reference of the item                      |
