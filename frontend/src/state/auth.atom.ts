import { atom } from 'recoil'

export const authState = atom<{
  isAuthed: boolean
  user?: { id: string; email: string; name?: string }
}>({
  key: 'authState',
  default: { isAuthed: false, user: undefined }
})
