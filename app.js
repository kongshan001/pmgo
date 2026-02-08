let kanban;
let modal;

document.addEventListener('DOMContentLoaded', () => {
    kanban = new Kanban('kanban');
    modal = new Modal();

    document.addEventListener('refreshKanban', () => {
        kanban.refresh();
    });

    console.log('任务管理系统已启动');
});
