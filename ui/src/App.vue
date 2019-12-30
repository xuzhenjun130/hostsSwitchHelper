<template>
  <div id="app">
    <el-container style="height:100%">
      <el-aside width="200px;">
        <el-menu
          :default-active="activeIndex"
          background-color="#545c64"
          text-color="#fff"
          active-text-color="#409EFF"
          style="width:250px;"
          @select="changeMenu"
        >
          <el-menu-item index="0">
            <i class="el-icon-setting" />
            <span slot="title">系统hosts</span>
          </el-menu-item>

          <el-menu-item v-for="(item,key) in config" :key="key" :index="item.name">
            <span slot="title">
              <span class="itemName">{{ item.name }}</span>
              <span style="float:right;">
                <el-switch v-model="item.status" @change="updateStatus(item)" />
                <span style="margin-left:20px;">
                  <span class="el-icon-edit" title="修改" @click="update(item)" />
                  <span class="el-icon-delete" title="删除" @click="del(item)" />
                </span>
              </span>
            </span>
          </el-menu-item>
        </el-menu>
        <span style="position: fixed;bottom: 0;">
          <el-button
            type="primary"
            size="small"
            plain
            icon="el-icon-circle-plus"
            title="添加"
            @click="create"
          />
          <el-tooltip class="item" effect="dark" content="将打开chrome自动清理缓存" placement="top">
            <el-button type="primary" size="small" plain @click="clearCache">清chrome缓存</el-button>
          </el-tooltip>&nbsp;
          <a href="https://github.com/xuzhenjun130/hostsSwitchHelper.git" target="_blank">
            <el-button type="info" size="small" icon="el-icon-message" plain>关于</el-button>
          </a>
        </span>
      </el-aside>
      <el-main>
        <codemirror v-model="code" :options="cmOptions" @changes="changeCode" />
      </el-main>
    </el-container>

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="30%" :close-on-click-modal="false">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="80px"
        style="width: 80%; margin-left:50px;"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>

        <el-form-item label="IP" prop="ip">
          <el-input v-model="temp.ip" />
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <span>
          <el-button @click="dialogFormVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">确定</el-button>
        </span>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import aardio from 'aardio';
// language js
import 'codemirror/mode/ttcn-cfg/ttcn-cfg.js';

export default {
  name: 'AppHosts',
  data() {
    return {
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: '编辑',
        create: '添加'
      },
      value: true,
      systemCode: '', // 系统hosts
      code: '', // 当前生效的hosts
      activeIndex: '0',
      cmOptions: {
        // codemirror options
        tabSize: 4,
        mode: 'text/x-ttcn-cfg',
        lineNumbers: true,
        line: true,
        readOnly: true,
        extraKeys: {
          // 回车自动补全ip
          Enter: (cm) => {
            const doc = cm.doc;
            const line = doc.getCursor().line; // 当前行
            const text = doc.getLineHandle(line).text.trim(); // 当前行的内容
            // 有空格、有#注释，自动跳到下一行
            if (text.length === 0 || text.indexOf(' ') > 0 || text.indexOf('#') === 0) {
              cm.execCommand('newlineAndIndent');
              return;
            }
            if (!this.temp.ip) {
              return;
            }
            cm.execCommand('goLineStartSmart'); // 跳到行首
            cm.replaceSelection(this.temp.ip + ' '); // 输入ip
            setTimeout(() => {
              cm.execCommand('goLineEndAlt-Right'); // 调到行位
              cm.execCommand('goLineDown');// 下一行
              setTimeout(() => {
                cm.execCommand('newlineAndIndent'); // 换行
              }, 200);
            }, 200);
          }
        }
      },
      config: [],
      temp: { name: '', status: true, hosts: '', ip: '' },
      rules: {
        name: [{ required: true, message: '不得为空' }],
        ip: [{ required: true, message: '不得为空' }]
      },
      currentItem: {} // 当前正在编辑,旧的值
    };
  },

  created() {
    // 禁用页面的ctrl功能，来禁止ctrl+s保存功能
    window.addEventListener('keydown', function(e) {
      if (
        e.keyCode === 83 &&
        (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)
      ) {
        e.preventDefault();
      }
    });
  },

  mounted() {
    this.systemHosts();
    this.getList();
  },

  methods: {
    systemHosts() {
      // 获取系统配置
      setTimeout(() => {
        // eslint-disable-next-line no-undef
        aardio.hosts().then(data => {
          this.systemCode = data;
          this.code = data;
        });
      }, 100);
    },
    getList() {
      // 获取全部配置
      setTimeout(() => {
        // eslint-disable-next-line no-undef
        aardio.getConfig().then(data => {
          if (data.length) {
            for (const item of data) {
              item.status = item.status === 'on';
            }
            this.config = data;
          } else {
            this.config = [];
          }
        });
      }, 200);
    },
    clearCache() {
      // eslint-disable-next-line no-undef
      aardio.clearCache().then(rs => {
        this.$notify({ title: '操作成功', message: '已完成清chrome缓存' });
      });
    },
    // 左侧菜单切换
    changeMenu(index) {
      this.activeIndex = index;
      if (index === '0') {
        this.systemHosts();
        this.cmOptions.readOnly = true;
      } else {
        this.cmOptions.readOnly = false;
        for (const item of this.config) {
          if (item.name === index) {
            this.temp = item;
            this.code = item.hosts;
            break;
          }
        }
      }
    },
    // 右侧 编辑
    changeCode() {
      for (const item of this.config) {
        // 更新配置
        if (this.activeIndex !== '0' && item.name === this.activeIndex) {
          item.hosts = this.code;
          // eslint-disable-next-line no-undef
          aardio.update(
            item.name,
            item.name,
            item.status === true ? 'on' : 'off',
            item.hosts,
            item.ip
          );
          console.log(item, '更新配置');
          break;
        }
      }
    },
    create() {
      this.temp.name = '';
      this.temp.ip = '';
      this.dialogStatus = 'create';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate();
      });
    },
    createData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          // eslint-disable-next-line no-undef
          aardio.create(this.temp.name, this.temp.ip);
          this.config.push({
            name: this.temp.name,
            status: true,
            hosts: '# ' + this.temp.name,
            ip: this.temp.ip
          });
          // 激活当前配置
          this.activeIndex = this.temp.name;
          this.code = '# ' + this.temp.name;
          this.cmOptions.readOnly = false;
          this.dialogFormVisible = false;
          console.log(this.temp, '新增配置');
        }
      });
    },
    // 修改名称弹窗
    update(item) {
      this.currentItem = Object.assign({}, item);
      this.temp = Object.assign({}, item); // copy obj
      this.dialogStatus = 'update';
      this.dialogFormVisible = true;
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate();
      });
    },
    updateData() {
      this.$refs['dataForm'].validate(valid => {
        if (valid) {
          this.currentItem.name = this.temp.name; // 修改名称
          // 替换ip
          if (this.currentItem.ip) {
            this.temp.hosts = this.temp.hosts.replace(new RegExp(this.currentItem.ip, 'gm'), this.temp.ip);
          }

          this.code = this.temp.hosts;
          // eslint-disable-next-line no-undef
          aardio.update(
            this.currentItem.name,
            this.temp.name,
            this.temp.status === true ? 'on' : 'off',
            this.temp.hosts,
            this.temp.ip
          );
          this.dialogFormVisible = false;
        }
      });
    },
    // 修改状态
    updateStatus(item) {
      // eslint-disable-next-line no-undef
      aardio.update(
        item.name,
        item.name,
        item.status === true ? 'on' : 'off',
        item.hosts,
        item.ip
      );
    },
    del(item) {
      this.$confirm('是否要删除: ' + item.name + '？', '操作确认')
        .then(() => {
          // eslint-disable-next-line no-undef
          aardio.del(item.name);
          const i = this.config.indexOf(item);
          this.config.splice(i, 1);
          this.activeIndex = '0';
        })
        .catch(() => {});
    }
  }
};
</script>

 <style type="text/css">
html,
body,
#app,
.vue-codemirror，.el-container,
.el-aside,
.el-main {
  height: 100%;
}
.el-aside .menubar,
.vue-codemirror {
  height: 100%;
}
.el-main {
  padding: 0 !important;
  margin: 0;
}
body {
  margin: 0;
}
.CodeMirror {
  height: 100% !important;
}
.el-aside {
  background: rgb(84, 92, 100);
  height: 100%;
}
.el-menu-item.is-active {
  background: rgb(67, 74, 80) !important;
}
.itemName{
  width:90px;
  overflow: hidden;
  float: left;
  text-overflow: ellipsis;
  white-space: nowrap;

}
</style>
