import { mount } from '@vue/test-utils'
import TaskCard from '~/components/TaskCard.vue'
import type { Task } from '~/stores/tasks'

const mockTask: Task = {
  id: 'task-uuid-1',
  shortDescription: 'Ma tâche',
  longDescription: null,
  dueDate: new Date('2026-07-15').toISOString(),
  completedAt: null,
  listId: 'list-uuid-1',
  createdAt: new Date('2026-01-10').toISOString(),
  updatedAt: new Date('2026-01-10').toISOString()
}

describe('TaskCard', () => {
  describe('affichage', () => {
    it('affiche la description courte', () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).toContain('Ma tâche')
    })

    it("affiche la date d'échéance formatée", () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).toContain('juil')
    })

    it('affiche la description longue si présente', () => {
      const task = { ...mockTask, longDescription: 'Description détaillée' }
      const wrapper = mount(TaskCard, { props: { task } })
      expect(wrapper.text()).toContain('Description détaillée')
    })

    it("n'affiche pas la description longue si absente", () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.text()).not.toContain('Description')
    })

    it('applique opacity-70 si la tâche est terminée', () => {
      const task = { ...mockTask, completedAt: new Date().toISOString() }
      const wrapper = mount(TaskCard, { props: { task } })
      expect(wrapper.find('div').classes()).toContain('opacity-70')
    })

    it("n'applique pas opacity-70 si la tâche est active", () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      expect(wrapper.find('div').classes()).not.toContain('opacity-70')
    })
  })

  describe('bouton complétion', () => {
    it('émet complete au clic si la tâche est active', async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('complete')?.[0]).toEqual([mockTask.id])
    })

    it('émet reactivate au clic si la tâche est terminée', async () => {
      const task = { ...mockTask, completedAt: new Date().toISOString() }
      const wrapper = mount(TaskCard, { props: { task } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('reactivate')?.[0]).toEqual([task.id])
    })

    it("n'émet pas select au clic sur le bouton (stop propagation)", async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('button').trigger('click')
      expect(wrapper.emitted('select')).toBeUndefined()
    })
  })

  describe('sélection de la carte', () => {
    it('émet select avec la tâche au clic sur la carte', async () => {
      const wrapper = mount(TaskCard, { props: { task: mockTask } })
      await wrapper.find('div').trigger('click')
      expect(wrapper.emitted('select')?.[0]).toEqual([mockTask])
    })
  })
})
