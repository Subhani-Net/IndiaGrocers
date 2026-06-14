export interface NavGrandchild {
  name: string
  handle: string
}

export interface NavChild {
  name: string
  handle: string
  isVirtual?: boolean
  grandchildren: NavGrandchild[]
}

export interface NavCategory {
  name: string
  handle: string
  children: NavChild[]
}
