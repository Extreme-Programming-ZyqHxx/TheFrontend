const BASE_URL = 'https://contact-backend.vercel.app/api';
let groups = [];

// 页面加载时初始化
window.onload = function() {
    const user_id = localStorage.getItem('user_id');
    if (user_id) {
        loadGroups();
        loadContacts();
    } else {
        window.location.href = 'login.html';
    }
};

// 退出登录
function logout() {
    if (confirm('确定退出？')) {
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// 加载分组
function loadGroups() {
    axios.get(`${BASE_URL}/groups`)
        .then(res => {
            groups = res.data || [];
            renderGroupSelect('add-group-id');
            renderGroupSelect('edit-group-id');
            renderFilterGroupSelect();
        })
        .catch(err => {
            console.error('加载分组失败：', err);
            handleAuthError(err);
        });
}

// 渲染分组下拉框
function renderGroupSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = '';
    if (groups.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '暂无分组，请先添加';
        select.appendChild(option);
        select.disabled = true;
    } else {
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.group_name;
            select.appendChild(option);
        });
        select.disabled = false;
    }
}

// 渲染筛选下拉框
function renderFilterGroupSelect() {
    const filter = document.getElementById('group-filter');
    filter.innerHTML = '<option value="0">全部联系人</option>';
    if (groups.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = '暂无分组';
        filter.appendChild(option);
        filter.disabled = true;
    } else {
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.group_name;
            filter.appendChild(option);
        });
        filter.disabled = false;
    }
}

// 加载联系人
function loadContacts() {
    axios.get(`${BASE_URL}/contacts`)
        .then(res => renderContacts(res.data || []))
        .catch(err => {
            console.error('加载联系人失败：', err);
            handleAuthError(err);
        });
}

// 渲染联系人列表
function renderContacts(contacts) {
    const tbody = document.getElementById('contact-table');
    tbody.innerHTML = '';

    if (contacts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px; color:#999;">暂无联系人数据</td></tr>';
        return;
    }

    contacts.forEach(contact => {
        const group = groups.find(g => g.id == contact.group_id) || { group_name: '未分组' };
        tbody.innerHTML += `
            <tr>
                <td>${contact.name || '-'}</td>
                <td>${contact.phone || '-'}</td>
                <td>${group.group_name}</td>
                <td>
                    <button onclick="showEditModal('${contact.phone}', '${escape(contact.name)}', '${contact.phone}', ${contact.group_id})" class="btn">修改</button>
                    <button onclick="deleteContact('${contact.phone}')" class="btn btn-secondary">删除</button>
                </td>
            </tr>
        `;
    });
}

// 添加联系人
function addContact() {
    const name = document.getElementById('add-name').value.trim();
    const phone = document.getElementById('add-phone').value.trim();
    const groupId = document.getElementById('add-group-id').value;

    if (!name) return alert('请输入姓名');
    if (!/^\d{11}$/.test(phone)) return alert('请输入11位手机号');
    if (!groupId) return alert('请先添加分组');

    axios.post(`${BASE_URL}/contacts`, { name, phone, group_id: groupId })
        .then(() => {
            alert('添加成功');
            document.getElementById('add-name').value = '';
            document.getElementById('add-phone').value = '';
            loadContacts();
        })
        .catch(err => {
            const errMsg = err.response?.data?.error || '添加失败，请稍后重试';
            alert(errMsg);
            handleAuthError(err);
        });
}

// 显示修改弹窗
function showEditModal(oldPhone, name, phone, groupId) {
    document.getElementById('edit-phone-old').value = oldPhone;
    document.getElementById('edit-name').value = unescape(name);
    document.getElementById('edit-phone').value = phone;
    document.getElementById('edit-group-id').value = groupId;
    document.getElementById('edit-modal').style.display = 'flex';
}

// 关闭弹窗
function closeModal() {
    document.getElementById('edit-modal').style.display = 'none';
}

// 更新联系人
function updateContact() {
    const oldPhone = document.getElementById('edit-phone-old').value;
    const newName = document.getElementById('edit-name').value.trim();
    const newPhone = document.getElementById('edit-phone').value.trim();
    const newGroupId = document.getElementById('edit-group-id').value;

    if (!newName) return alert('请输入姓名');
    if (!/^\d{11}$/.test(newPhone)) return alert('请输入11位手机号');
    if (!newGroupId) return alert('请选择分组');

    axios.put(`${BASE_URL}/contacts`, {
        old_phone: oldPhone,
        new_name: newName,
        new_phone: newPhone,
        new_group_id: newGroupId
    }).then(() => {
        alert('修改成功');
        closeModal();
        loadContacts();
    }).catch(err => {
        const errMsg = err.response?.data?.error || '修改失败，请稍后重试';
        alert(errMsg);
        handleAuthError(err);
    });
}

// 删除联系人
function deleteContact(phone) {
    if (!confirm('确定删除该联系人？删除后不可恢复')) return;

    axios.delete(`${BASE_URL}/contacts`, { data: { phone } })
        .then(() => {
            alert('删除成功');
            loadContacts();
        })
        .catch(err => {
            const errMsg = err.response?.data?.error || '删除失败，请稍后重试';
            alert(errMsg);
            handleAuthError(err);
        });
}

// 搜索联系人
function searchContacts() {
    const keyword = document.getElementById('search-input').value.trim();
    axios.get(`${BASE_URL}/contacts?keyword=${encodeURIComponent(keyword)}`)
        .then(res => renderContacts(res.data || []))
        .catch(err => alert('搜索失败：' + (err.message || '网络错误')));
}

// 重置搜索
function resetSearch() {
    document.getElementById('search-input').value = '';
    loadContacts();
}

// 按分组筛选
function filterByGroup() {
    const groupId = document.getElementById('group-filter').value;
    if (groupId === '0') {
        loadContacts();
        return;
    }
    if (!groupId) return;
    axios.get(`${BASE_URL}/contacts?group_id=${groupId}`)
        .then(res => renderContacts(res.data || []))
        .catch(err => alert('筛选失败：' + (err.message || '网络错误')));
}

// 添加分组
function addGroup() {
    const groupName = document.getElementById('add-group-name').value.trim();
    if (!groupName) return alert('请输入分组名称');

    axios.post(`${BASE_URL}/groups`, { group_name: groupName })
        .then(() => {
            alert('分组添加成功');
            document.getElementById('add-group-name').value = '';
            loadGroups();
        })
        .catch(err => {
            const errMsg = err.response?.data?.error || '添加分组失败，请稍后重试';
            alert(errMsg);
            handleAuthError(err);
        });
}

// 处理登录过期
function handleAuthError(err) {
    if (err.response?.status === 401) {
        alert('登录已过期，请重新登录');
        localStorage.clear();
        window.location.href = 'login.html';
    }
}

// 请求拦截器（携带用户ID）
axios.interceptors.request.use(config => {
    const user_id = localStorage.getItem('user_id');
    if (user_id) {
        config.headers['X-User-Id'] = user_id;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// 响应拦截器（统一错误处理）
axios.interceptors.response.use(response => {
    return response;
}, error => {
    if (!error.response) {
        alert('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
});

// ------------------- 新增：CSV 导入导出功能 -------------------
// 导出联系人到 CSV
function exportContacts() {
    if (document.getElementById('contact-table').innerHTML.includes('暂无联系人')) {
        alert('暂无联系人数据可导出');
        return;
    }
    // 获取所有联系人数据
    axios.get(`${BASE_URL}/contacts`)
        .then(res => {
            const contacts = res.data || [];
            // 构造 CSV 内容
            let csvContent = '姓名,手机号,所属分组\n';
            contacts.forEach(contact => {
                const group = groups.find(g => g.id == contact.group_id) || { group_name: '未分组' };
                // 处理逗号转义
                const name = contact.name.replace(/,/g, '，');
                const phone = contact.phone;
                const groupName = group.group_name.replace(/,/g, '，');
                csvContent += `${name},${phone},${groupName}\n`;
            });
            // 下载 CSV 文件
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `通讯录_${new Date().toLocaleDateString()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .catch(err => alert('导出失败：' + (err.message || '网络错误')));
}

// 导入 CSV 文件解析
function importContacts(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        alert('请选择 CSV 格式文件');
        event.target.value = '';
        return;
    }
    // 解析 CSV
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const lines = content.split('\n');
        const importList = [];
        // 跳过表头
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const [name, phone, groupName] = line.split(',');
            if (!name || !phone || !/^\d{11}$/.test(phone)) {
                alert(`第 ${i+1} 行数据格式错误，跳过导入`);
                continue;
            }
            // 查找分组 ID
            let groupId = '';
            if (groupName) {
                const group = groups.find(g => g.group_name === groupName);
                if (group) {
                    groupId = group.id;
                } else {
                    alert(`第 ${i+1} 行分组【${groupName}】不存在，跳过导入`);
                    continue;
                }
            }
            if (!groupId) {
                alert(`第 ${i+1} 行无有效分组，跳过导入`);
                continue;
            }
            importList.push({ name, phone, group_id: groupId });
        }
        // 批量导入
        if (importList.length === 0) {
            alert('无有效数据可导入');
            event.target.value = '';
            return;
        }
        // 调用后端批量导入接口（需后端支持）
        axios.post(`${BASE_URL}/contacts/batch`, { contacts: importList })
            .then(() => {
                alert(`成功导入 ${importList.length} 条联系人数据`);
                event.target.value = '';
                loadContacts();
            })
            .catch(err => {
                alert('批量导入失败：' + (err.response?.data?.error || err.message));
                event.target.value = '';
            });
    };
    reader.readAsText(file, 'utf-8');
}