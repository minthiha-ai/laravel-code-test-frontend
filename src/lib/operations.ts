export const LOGIN = /* GraphQL */ `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      access_token
      token_type
      expires_in
      refresh_token
    }
  }
`

export const ME = /* GraphQL */ `
  query Me {
    me {
      id
      name
      username
      email
    }
  }
`

export const EMPLOYEES = /* GraphQL */ `
  query Employees($first: Int!, $page: Int) {
    employees(first: $first, page: $page) {
      data {
        id
        first_name
        last_name
        email
        phone
        address
        salary
        created_at
        updated_at
      }
      paginatorInfo {
        count
        currentPage
        lastPage
        perPage
        total
        hasMorePages
      }
    }
  }
`

export const UPDATE_EMPLOYEE = /* GraphQL */ `
  mutation UpdateEmployee($input: UpdateEmployeeInput!) {
    updateEmployee(input: $input) {
      id
      first_name
      last_name
      email
      phone
      address
      salary
      updated_at
    }
  }
`

export const DELETE_EMPLOYEE = /* GraphQL */ `
  mutation DeleteEmployee($id: ID!) {
    deleteEmployee(id: $id) {
      id
      first_name
      last_name
    }
  }
`

export const IMPORT_EMPLOYEES = /* GraphQL */ `
  mutation ImportEmployees($file: Upload!) {
    importEmployees(file: $file) {
      message
      queued
      import_id
    }
  }
`

export const IMPORT_STATUS = /* GraphQL */ `
  query ImportStatus($id: String!) {
    importStatus(id: $id) {
      status
      processed
      total
    }
  }
`
