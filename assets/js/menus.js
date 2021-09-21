export default [
  {
    type: 'undo',
    title: '撤销',
    innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="18" height="18"><path d="M76 463.7l294.8 294.9c19.5 19.4 52.8 5.6 52.8-21.9V561.5c202.5-8.2 344.1 59.5 501.6 338.3 8.5 15 31.5 7.9 30.6-9.3-30.5-554.7-453-571.4-532.3-569.6v-174c0-27.5-33.2-41.3-52.7-21.8L75.9 420c-12 12.1-12 31.6.1 43.7z"/></svg>'
  },
  {
    type: 'redo',
    title: '重做',
    innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="18" height="18"><path d="M946.8 420L651.9 125.1c-19.5-19.5-52.7-5.7-52.7 21.8v174c-79.3-1.8-501.8 14.9-532.3 569.6-.9 17.2 22.1 24.3 30.6 9.3C255 621 396.6 553.3 599.1 561.5v175.2c0 27.5 33.3 41.3 52.8 21.9l294.8-294.9c12.1-12.1 12.1-31.6.1-43.7z"/></svg>'
  },
  {
    type: 'preview',
    title: '预览/取消预览',
    innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20"><path d="M832 128c70.692 0 128 57.308 128 128v512c0 70.692-57.308 128-128 128H192c-70.692 0-128-57.308-128-128V256c0-70.692 57.308-128 128-128h640zm0 72H192c-30.619 0-55.498 24.573-56 55.074V768c0 30.619 24.573 55.498 55.074 55.992L192 824h640c30.619 0 55.498-24.573 56-55.074V256c0-30.619-24.573-55.498-55.074-55.992L832 200zM693.031 450.127l.425.417 128 128c13.918 13.918 14.057 36.398.417 50.487l-.417.425-128 128c-14.059 14.059-36.853 14.059-50.912 0-13.918-13.918-14.057-36.398-.417-50.487l.417-.425L745.09 604 642.544 501.456c-13.918-13.918-14.057-36.398-.417-50.487l.417-.425c13.918-13.918 36.398-14.057 50.487-.417zM284 312c19.882 0 36 16.118 36 36s-16.118 36-36 36h-56c-19.882 0-36-16.118-36-36s16.118-36 36-36h56zm512 0c19.882 0 36 16.118 36 36s-16.118 36-36 36H420c-19.882 0-36-16.118-36-36s16.118-36 36-36h376z"/></svg>'
  },
  {
    type: 'draft',
    title: '保存草稿',
    innerHTML: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="20" height="20"><path d="M96 960a32 32 0 1 1 0-64h832a32 32 0 1 1 0 64H96zm632.96-625.152L593.088 199.104l-340.48 340.48L240 690.432l148.032-14.784 340.8-340.8zm45.184-45.248l45.248-45.248-135.744-135.744-45.248 45.248L774.144 289.6zm-45.12-226.176l135.808 135.808c31.232 31.232 24.832 65.408-.192 90.368L412.16 742.144l-247.168 24.448 20.864-250.688L638.336 63.36c25.024-24.96 59.456-31.168 90.688.064z"/></svg>'
  },
  {
    type: 'publish',
    title: '发布文章',
    innerHTML: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="20" height="20"><path d="M128 554.667h768a42.667 42.667 0 0 0 0-85.334H128a42.667 42.667 0 0 0 0 85.334z"/><path d="M469.333 128v768a42.667 42.667 0 0 0 85.334 0V128a42.667 42.667 0 0 0-85.334 0z"/></svg>'
  },
]