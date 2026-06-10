import { ipcMain } from 'electron'
import * as chat from './chat'

export const registerChatHandlers = (): void => {
  ipcMain.handle('chat:list', (_event, projectId?: number) => chat.listChats(projectId))

  ipcMain.handle('chat:get', (_event, chatId: number) => chat.getChat(chatId))

  ipcMain.handle('chat:create', (_event, projectId?: number, title?: string | null) =>
    chat.createChat(projectId, title)
  )

  ipcMain.handle(
    'chat:appendMessage',
    (_event, chatId: number, role: chat.ChatMessageRow['role'], content: string) =>
      chat.appendMessage(chatId, role, content)
  )

  ipcMain.handle('chat:delete', (_event, chatId: number) => {
    chat.deleteChat(chatId)
  })

  ipcMain.handle(
    'chat:updateTitle',
    (_event, chatId: number, title: string, titleStatus?: chat.ChatRow['title_status']) =>
      chat.updateChatTitle(chatId, title, titleStatus)
  )

  ipcMain.handle('chat:generateTitle', (_event, chatId: number) => chat.mockGenerateTitle(chatId))
}
