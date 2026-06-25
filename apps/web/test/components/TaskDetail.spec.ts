import { mount } from '@vue/test-utils'
import TaskDetail from '~/components/TaskDetail.vue'
import type { Task } from '~/stores/tasks'

const mockTask: Task = {
  id: 'task-uuid-1',
  shortDescription: 'Ma tâche importante',
  longDescription: null,
  dueDate: new Date('2026-07-15').toISOString(),
  completedAt: null,
  listId: 'list-uuid-1',
  createdAt: new Date('2026-01-10').toISOString(),
  updatedAt: new Date('2026-01-10').toISOString()
}

const mockTaskB: Task = {
  ...mockTask,
  id: 'task-uuid-2',
  shortDescription: 'Autre tâche'
}

const mountDetail = (task: Task | null = mockTask, deleting = false, error: string | null = null) =>
  mount(TaskDetail, {
    props: { task, deleting, error },
    global: { stubs: { Teleport: true, ConfirmModal: true, Transition: false } }
  })

describe('TaskDetail', () => {
  describe('affichage', () => {
    it('ne rend pas le panneau si task est null', () => {
      const wrapper = mountDetail(null)
      expect(wrapper.find('[data-testid="detail-panel"]').exists()).toBe(false)
    })

    it('affiche le panneau si task est définie', () => {
      const wrapper = mountDetail()
      expect(wrapper.find('[data-testid="detail-panel"]').exists()).toBe(true)
    })

    it('affiche la description courte', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('Ma tâche importante')
    })

    it("affiche la date d'échéance", () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('juil')
    })

    it('affiche la date de création', () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).toContain('janv')
    })

    it('affiche la description longue si présente', () => {
      const task = { ...mockTask, longDescription: 'Détail complet de la tâche' }
      const wrapper = mountDetail(task)
      expect(wrapper.text()).toContain('Détail complet de la tâche')
    })

    it("n'affiche pas la section description longue si absente", () => {
      const wrapper = mountDetail()
      expect(wrapper.text()).not.toContain('Description')
    })

    it("affiche le message d'erreur si error est défini", () => {
      const wrapper = mountDetail(mockTask, false, 'Impossible de supprimer la tâche.')
      expect(wrapper.find('[data-testid="delete-error"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Impossible de supprimer la tâche.')
    })

    it("n'affiche pas de message d'erreur si error est null", () => {
      const wrapper = mountDetail()
      expect(wrapper.find('[data-testid="delete-error"]').exists()).toBe(false)
    })
  })

  describe('fermeture', () => {
    it('émet close au clic sur le bouton fermer', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="close-btn"]').trigger('click')
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('suppression', () => {
    it('affiche la modale de confirmation au clic sur Supprimer', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)
    })

    it("masque la modale à l'annulation", async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      wrapper.findComponent({ name: 'ConfirmModal' }).vm.$emit('cancel')
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })

    it("émet delete avec l'id de la tâche à la confirmation", async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      wrapper.findComponent({ name: 'ConfirmModal' }).vm.$emit('confirm')
      await wrapper.vm.$nextTick()
      expect(wrapper.emitted('delete')?.[0]).toEqual([mockTask.id])
    })

    it('réinitialise la modale quand task passe à null', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)

      await wrapper.setProps({ task: null })
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })

    it('réinitialise la modale quand task change vers une autre tâche', async () => {
      const wrapper = mountDetail()
      await wrapper.find('[data-testid="delete-btn"]').trigger('click')
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(true)

      await wrapper.setProps({ task: mockTaskB })
      await wrapper.vm.$nextTick()
      expect(wrapper.findComponent({ name: 'ConfirmModal' }).exists()).toBe(false)
    })
  })
})
