// 反馈管理功能增强版 - 添加到admin.html的script标签内

// ==================== 反馈状态管理 ====================
let currentFeedbackTab = 'pending'; // 当前标签：pending 或 processed
let allFeedbacks = []; // 所有反馈数据

// 切换反馈标签
function switchFeedbackTab(tab) {
  currentFeedbackTab = tab;
  
  // 更新标签样式
  const pendingTab = document.getElementById('tabPending');
  const processedTab = document.getElementById('tabProcessed');
  const filterBar = document.getElementById('processedFilterBar');
  
  if (tab === 'pending') {
    pendingTab.style.cssText = 'flex: 1; padding: 15px; text-align: center; cursor: pointer; border-bottom: 2px solid var(--accent-blue); background: var(--bg-tertiary); color: var(--text-white); font-weight: 500;';
    processedTab.style.cssText = 'flex: 1; padding: 15px; text-align: center; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text-secondary);';
    filterBar.style.display = 'none';
  } else {
    processedTab.style.cssText = 'flex: 1; padding: 15px; text-align: center; cursor: pointer; border-bottom: 2px solid var(--accent-blue); background: var(--bg-tertiary); color: var(--text-white); font-weight: 500;';
    pendingTab.style.cssText = 'flex: 1; padding: 15px; text-align: center; cursor: pointer; border-bottom: 2px solid transparent; color: var(--text-secondary);';
    filterBar.style.display = 'flex';
  }
  
  renderFeedbackList();
}

// 渲染反馈列表
function renderFeedbackList() {
  const list = document.getElementById('feedbackList');
  
  // 根据当前标签筛选
  let filteredFeedbacks = allFeedbacks.filter(f => {
    if (currentFeedbackTab === 'pending') {
      return f.status !== 'processed';
    } else {
      return f.status === 'processed';
    }
  });
  
  // 已处理标签下的额外筛选
  if (currentFeedbackTab === 'processed') {
    const timeFilter = document.getElementById('feedbackTimeFilter')?.value;
    const typeFilter = document.getElementById('feedbackTypeFilter')?.value;
    
    if (timeFilter) {
      const now = new Date();
      filteredFeedbacks = filteredFeedbacks.filter(f => {
        const feedbackDate = new Date(f.createdAt);
        switch(timeFilter) {
          case 'today':
            return feedbackDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            return feedbackDate >= weekAgo;
          case 'month':
            return feedbackDate.getMonth() === now.getMonth() && feedbackDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }
    
    if (typeFilter) {
      filteredFeedbacks = filteredFeedbacks.filter(f => f.type === typeFilter);
    }
  }
  
  // 按时间倒序
  filteredFeedbacks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  if (filteredFeedbacks.length === 0) {
    const emptyMessage = currentFeedbackTab === 'pending' 
      ? '暂无未处理反馈<br><span style="font-size:12px;opacity:0.7;">网页端和客户端提交的反馈将显示在这里</span>'
      : '暂无已处理反馈';
    list.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:60px 40px;"><i class="fas fa-inbox" style="font-size:48px;margin-bottom:15px;display:block;"></i>${emptyMessage}</div>`;
    return;
  }
  
  const typeColors = {
    'bug': '#e74c3c',
    'feature': '#3498db',
    'complaint': '#f39c12',
    'other': '#95a5a6'
  };
  const typeNames = {
    'bug': 'Bug',
    'feature': '建议',
    'complaint': '投诉',
    'other': '其他'
  };
  
  list.innerHTML = filteredFeedbacks.map(f => {
    const typeColor = typeColors[f.type] || typeColors['other'];
    const typeName = typeNames[f.type] || typeNames['other'];
    const isProcessed = f.status === 'processed';
    
    return `
      <div class="feedback-item" onclick="${isProcessed ? '' : `processFeedback('${f.id}')`}" style="display: grid; grid-template-columns: 80px 1fr 120px 100px 80px; gap: 15px; padding: 15px 20px; border-bottom: 1px solid var(--border-color); align-items: start; transition: background 0.2s; cursor: ${isProcessed ? 'default' : 'pointer'};" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background='transparent'">
        <!-- 类型 -->
        <div>
          <span style="background:${typeColor};color:#fff;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:500;display:inline-block;">${typeName}</span>
        </div>
        
        <!-- 内容 -->
        <div style="color:var(--text-primary);font-size:13px;line-height:1.5;word-break:break-word;">${f.content || ''}</div>
        
        <!-- 联系方式 -->
        <div style="color:var(--text-secondary);font-size:12px;">
          ${f.contact ? `<div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${f.contact}">${f.contact}</div>` : '<span style="opacity:0.5;">-</span>'}
          <div style="font-size:11px;margin-top:4px;opacity:0.7;">${f.user || '匿名'}</div>
        </div>
        
        <!-- 时间 -->
        <div style="color:var(--text-secondary);font-size:12px;white-space:nowrap;">
          ${f.createdAt ? new Date(f.createdAt).toLocaleString('zh-CN', {month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : '-'}
        </div>
        
        <!-- 状态 -->
        <div>
          ${isProcessed 
            ? '<span style="color: var(--accent-green); font-size: 12px;"><i class="fas fa-check-circle"></i> 已处理</span>'
            : '<span style="color: var(--accent-red); font-size: 12px; font-weight: 500;">● 未处理</span>'
          }
        </div>
      </div>
    `;
  }).join('');
}

// 处理反馈（标记为已处理）
async function processFeedback(feedbackId) {
  if (!confirm('确定将此反馈标记为已处理？')) return;
  
  const feedback = allFeedbacks.find(f => f.id === feedbackId);
  if (!feedback) return;
  
  feedback.status = 'processed';
  feedback.processedAt = new Date().toISOString();
  
  // 同步到API
  try {
    await fetch(`${API_BASE_URL}/api/admin/feedback`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Password': ADMIN_PASSWORD
      },
      body: JSON.stringify({ id: feedbackId, status: 'processed' })
    });
  } catch (error) {
    console.error('更新反馈状态失败:', error);
  }
  
  // 保存到本地
  localStorage.setItem('gamebox_feedbacks_backup', JSON.stringify(allFeedbacks));
  
  // 更新未处理数量
  const pendingCount = allFeedbacks.filter(f => f.status !== 'processed').length;
  document.getElementById('pendingCount').textContent = pendingCount;
  
  // 重新渲染
  renderFeedbackList();
  
  alert('反馈已标记为已处理');
}

// 修改原有的viewFeedbacks函数
async function viewFeedbacks() {
  const list = document.getElementById('feedbackList');
  list.innerHTML = '<div style="text-align:center;color:var(--text-secondary);padding:40px;"><i class="fas fa-spinner fa-spin"></i> 加载中...</div>';
  document.getElementById('feedbackModal').classList.add('show');
  
  // 重置标签到未处理
  currentFeedbackTab = 'pending';
  switchFeedbackTab('pending');
  
  console.log('正在获取反馈，API地址:', API_BASE_URL);
  
  // 先测试API连接
  const apiAvailable = await testAPIConnection();
  if (!apiAvailable) {
    // 尝试从本地加载
    const backup = localStorage.getItem('gamebox_feedbacks_backup');
    if (backup) {
      try {
        allFeedbacks = JSON.parse(backup);
        renderFeedbackList();
        return;
      } catch (e) {
        console.error('读取本地备份失败:', e);
      }
    }
    
    list.innerHTML = `
      <div style="text-align:center;padding:40px;color:var(--text-secondary);">
        <i class="fas fa-plug" style="font-size:48px;color:var(--accent-red);margin-bottom:15px;"></i>
        <p>无法连接到API服务器</p>
        <p style="font-size:12px;margin-top:10px;">请检查网络连接和API地址配置</p>
        <button class="btn btn-primary" onclick="refreshFeedbacks()" style="margin-top:15px;">
          <i class="fas fa-sync"></i> 重新加载
        </button>
      </div>
    `;
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/feedbacks`, {
      headers: { 'X-Admin-Password': ADMIN_PASSWORD }
    });
    
    if (response.status === 401) {
      throw new Error('管理员密码错误');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    allFeedbacks = data.feedbacks || [];
    
    // 保存到本地
    localStorage.setItem('gamebox_feedbacks_backup', JSON.stringify(allFeedbacks));
    
    // 更新未处理数量
    const pendingCount = allFeedbacks.filter(f => f.status !== 'processed').length;
    document.getElementById('pendingCount').textContent = pendingCount;
    
    renderFeedbackList();
  } catch (error) {
    console.error('获取反馈失败:', error);
    
    // 尝试从本地加载
    const backup = localStorage.getItem('gamebox_feedbacks_backup');
    if (backup) {
      allFeedbacks = JSON.parse(backup);
      renderFeedbackList();
    } else {
      list.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-secondary);"><i class="fas fa-exclamation-triangle" style="font-size:48px;color:var(--accent-red);margin-bottom:15px;"></i><p>加载失败: ${error.message}</p></div>`;
    }
  }
}

// 修改refreshFeedbacks函数
function refreshFeedbacks() {
  viewFeedbacks();
}
