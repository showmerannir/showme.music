const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'

export interface ClickUpTask {
  id: string
  name: string
  description?: string
  status: {
    status: string
    color?: string
  }
  url: string
  date_created: string
  date_updated: string
}

export interface ClickUpStatus {
  status: string
  color: string
  orderindex: number
  type: string
}

export interface ClickUpList {
  id: string
  name: string
  statuses: ClickUpStatus[]
}

export interface CreateTaskPayload {
  name: string
  description?: string
  status?: string
  priority?: number
  assignees?: number[]
  tags?: string[]
  due_date?: number
  custom_fields?: Array<{
    id: string
    value: unknown
  }>
}

export interface UpdateTaskPayload {
  name?: string
  description?: string
  status?: string
  priority?: number
}

export class ClickUpClient {
  private apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${CLICKUP_BASE_URL}${path}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.apiToken,
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(
        `ClickUp API error ${response.status} ${response.statusText}: ${errorText}`
      )
    }

    return response.json() as Promise<T>
  }

  async createTask(listId: string, payload: CreateTaskPayload): Promise<ClickUpTask> {
    return this.request<ClickUpTask>('POST', `/list/${listId}/task`, payload)
  }

  async updateTask(taskId: string, payload: UpdateTaskPayload): Promise<ClickUpTask> {
    return this.request<ClickUpTask>('PUT', `/task/${taskId}`, payload)
  }

  async addComment(taskId: string, text: string): Promise<{ id: string }> {
    return this.request<{ id: string }>('POST', `/task/${taskId}/comment`, {
      comment_text: text,
      notify_all: false,
    })
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>('GET', `/task/${taskId}`)
  }

  async getList(listId: string): Promise<ClickUpList> {
    return this.request<ClickUpList>('GET', `/list/${listId}`)
  }

  async getListStatuses(listId: string): Promise<string[]> {
    const list = await this.getList(listId)
    return list.statuses
      .sort((a, b) => a.orderindex - b.orderindex)
      .map((s) => s.status)
  }
}
