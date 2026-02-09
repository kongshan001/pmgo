let kanban;
let modal;

document.addEventListener('DOMContentLoaded', async () => {
    kanban = new Kanban('boardContainer');
    modal = new Modal();

    document.addEventListener('refreshKanban', async () => {
        await kanban.refresh();
    });

    console.log('任务管理系统已启动（支持模块功能）');
});
