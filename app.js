let kanban;
let modal;

document.addEventListener('DOMContentLoaded', () => {
    kanban = new Kanban('boardContainer');
    modal = new Modal();

    document.addEventListener('refreshKanban', () => {
        kanban.refresh();
    });

    console.log('任务管理系统已启动（支持模块功能）');
});
