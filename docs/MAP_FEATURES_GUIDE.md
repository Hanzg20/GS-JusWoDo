# 🗺️ 地图功能完整指南

本文档详细介绍了 JUSTWEDO (渥帮) 平台的所有地图相关功能，包括核心 UI/UX 功能和高级技术特性。

**最后更新**: 2026-01-30
**版本**: v3.0

---

## 📋 功能总览

### 核心功能（MapDiscovery 页面）

| 功能 | 状态 | 文件位置 | 描述 |
|------|------|----------|------|
| ✅ 地图/列表切换 | 已完成 | `pages/MapDiscovery.tsx` | 移动端全屏列表、桌面端侧边栏 |
| ✅ 类型筛选器 | 已完成 | `pages/MapDiscovery.tsx` | 按ALL/GOODS/SERVICE/TASK/RENTAL筛选 |
| ✅ 搜索此区域 | 已完成 | `pages/MapDiscovery.tsx` | 地图移动后重新搜索 |
| ✅ 彩色标记 | 已完成 | `pages/MapDiscovery.tsx` | 按类型显示不同颜色（蓝/绿/橙/紫） |
| ✅ 用户定位 | 已完成 | `pages/MapDiscovery.tsx` | 蓝色脉动标记显示当前位置 |
| ✅ 弹窗卡片 | 已完成 | `pages/MapDiscovery.tsx` | 点击标记显示服务详情卡片 |
| ✅ 距离显示 | 已完成 | `pages/MapDiscovery.tsx` | 自动计算并显示距离（m/km） |

### 高级功能

| 功能 | 状态 | 文件位置 | 描述 |
|------|------|----------|------|
| ✅ 服务半径选择 | 已完成 | `LocationPicker.tsx` | Provider可设置服务范围（1-50km） |
| ✅ 批量地理编码 | 已完成 | `scripts/batch-geocode-listings.ts` | 为现有listings批量添加坐标 |
| ✅ 地图标记聚类 | 已完成 | `components/map/MarkerCluster.tsx` | 密集区域自动聚类显示 |
| ✅ 路线导航集成 | 已完成 | `utils/navigation.ts` | 支持Google/Apple/Waze导航 |
| ✅ 地理围栏提醒 | 已完成 | `hooks/useGeofencing.ts` | 进入服务区域自动提醒 |

---

## 🗺️ 核心地图功能详解

### 0️⃣ MapDiscovery 页面总览

#### 页面结构
```
┌─────────────────────────────────────────┐
│ Header (导航栏)                          │
├─────────────────────────────────────────┤
│ ┌─────────────────────────────────────┐ │
│ │ [ALL] GOODS SERVICE TASK RENTAL    │ │ ← 类型筛选器
│ └─────────────────────────────────────┘ │
│                                         │
│  🗺️ Interactive Map                    │
│   📍 [User Location]                   │ ← 用户位置（蓝色脉动）
│   🔵 [Service Marker]                  │ ← 服务标记（彩色）
│   🟢 [Goods Marker]                    │
│   🟠 [Task Marker]                     │
│                                         │
│  [🔍 搜索此区域] ← 地图移动后出现       │
│                                         │
│ ┌──────────────────┐                   │
│ │ 推荐服务    [12] │ ← 桌面侧边栏       │
│ │ [Listing Card]   │                   │
│ │ [Listing Card]   │                   │
│ └──────────────────┘                   │
│                                         │
│        [🔘 查看列表] ← 移动端切换按钮   │
└─────────────────────────────────────────┘
```

#### 响应式设计
- **移动端** (< md):
  - 地图全屏显示
  - 点击"查看列表"切换到全屏列表覆盖
  - 列表有下拉手柄指示器
- **桌面端** (≥ md):
  - 地图占据主要区域
  - 右侧浮动侧边栏显示列表
  - 同时可见地图和列表

---

### 1️⃣ 类型筛选器功能

#### 功能描述
顶部筛选栏允许按服务类型快速过滤地图标记和列表。

#### 支持的类型
| 类型 | 标记颜色 | 描述 | 示例 |
|------|----------|------|------|
| **ALL** | - | 显示所有类型 | 全部服务 |
| **GOODS** | 🟢 绿色 | 商品销售 | 自制蛋糕、二手家具 |
| **SERVICE** | 🔵 蓝色 | 服务类 | 清洁、维修、理发 |
| **TASK** | 🟠 橙色 | 任务众包 | 搬家、遛狗、代购 |
| **RENTAL** | 🟣 紫色 | 租赁类 | 工具租赁、场地租赁 |

#### 使用方式
```tsx
// 点击任意类型按钮即可筛选
<Button onClick={() => setActiveType('SERVICE')}>
    SERVICE
</Button>

// 筛选逻辑
const results = await repo.search({
    lat, lng, radius,
    type: activeType === 'ALL' ? undefined : activeType
});
```

#### 视觉效果
```
┌──────────────────────────────────────────────────┐
│ [ALL] [GOODS] [SERVICE] [TASK] [RENTAL]          │
│   ↑ 选中状态：蓝色背景                              │
│     未选中：透明背景                                │
└──────────────────────────────────────────────────┘
```

---

### 2️⃣ 搜索此区域功能

#### 功能描述
当用户拖动或缩放地图后，底部出现"搜索此区域"按钮，点击后重新搜索当前可视区域内的服务。

#### 触发条件
- 地图拖动（moveend事件）
- 地图缩放（zoomend事件）

#### 搜索逻辑
```typescript
const handleSearchArea = (map: L.Map) => {
    // 获取地图中心点
    const center = map.getCenter();

    // 获取地图边界
    const bounds = map.getBounds();
    const northEast = bounds.getNorthEast();

    // 计算半径（中心到角落的距离）
    const radius = Math.round(center.distanceTo(northEast));

    // 重新搜索
    fetchListings(center.lat, center.lng, radius);
};
```

#### 视觉效果
```
┌────────────────────────────┐
│                            │
│   🗺️ [地图内容]           │
│                            │
│  ┌──────────────────────┐  │
│  │ 🔍 搜索此区域         │  │ ← 底部浮动按钮
│  └──────────────────────┘  │
│                            │
└────────────────────────────┘
```

#### 按钮样式
- 圆角全宽按钮
- 背景：primary蓝色
- 阴影：2xl深色阴影
- 悬停：scale-105放大效果

---

### 3️⃣ 彩色标记系统

#### 功能描述
根据服务类型显示不同颜色的地图标记，便于快速识别。

#### 标记设计
```typescript
const getIcon = (type: ListingType) => {
    let color = '#3b82f6'; // 蓝色 - SERVICE
    if (type === 'GOODS') color = '#10b981';   // 绿色
    if (type === 'TASK') color = '#f59e0b';    // 橙色
    if (type === 'RENTAL') color = '#8b5cf6';  // 紫色

    return L.divIcon({
        html: `
            <div style="
                background-color: ${color};
                width: 30px;
                height: 30px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
                <svg>📍</svg>
            </div>
        `
    });
};
```

#### 视觉效果
```
🔵 SERVICE (蓝色)
🟢 GOODS (绿色)
🟠 TASK (橙色)
🟣 RENTAL (紫色)
```

#### 标记特性
- **尺寸**: 30x30px圆形
- **边框**: 3px白色边框
- **阴影**: 黑色半透明阴影
- **图标**: MapPin SVG图标
- **锚点**: 底部中心 (15, 30)

---

### 4️⃣ 用户定位标记

#### 功能描述
在地图上显示用户当前GPS位置，使用蓝色脉动动画标记。

#### 实现代码
```tsx
{coords && (
    <Marker
        position={[coords.lat, coords.lng]}
        icon={L.divIcon({
            html: `
                <div class="
                    w-4 h-4
                    bg-blue-500
                    rounded-full
                    border-2 border-white
                    shadow-lg
                    animate-pulse
                "></div>
            `
        })}
    >
        <Popup>您在这里 / You are here</Popup>
    </Marker>
)}
```

#### 视觉效果
```
┌──────────────────┐
│                  │
│    🗺️ 地图       │
│                  │
│      🔵 ← 用户   │ (蓝色脉动圆点)
│                  │
└──────────────────┘
```

#### 特性
- **颜色**: 蓝色 (#3b82f6)
- **尺寸**: 16x16px
- **动画**: Tailwind `animate-pulse`
- **边框**: 2px白色
- **阴影**: 大阴影

---

### 5️⃣ 弹窗卡片设计

#### 功能描述
点击地图标记时，显示服务详情弹窗卡片。

#### 卡片结构
```
┌──────────────────────────────┐
│ [服务封面图片 - 220×96px]     │
│                    [SERVICE] │ ← 类型徽章
├──────────────────────────────┤
│ 深度保洁服务                  │ ← 标题
│ 专业团队，设备齐全...         │ ← 描述
│ ⭐ 4.8 (23) • Kanata Lakes   │ ← 评分+地址
│ 📍 2.3 km 外                  │ ← 距离
│ [详情 / 订购] ─────────────►  │ ← 操作按钮
└──────────────────────────────┘
```

#### 实现代码
```tsx
<Popup className="listing-popup">
    <Card className="w-[220px]">
        {/* 封面图片 */}
        <div className="h-24">
            <img src={listing.images[0]} />
            <Badge>{listing.type}</Badge>
        </div>

        {/* 内容区域 */}
        <CardContent className="p-3">
            <h4>{listing.titleZh}</h4>
            <p>{listing.descriptionZh}</p>

            {/* 评分 */}
            <div className="flex items-center">
                <Star className="fill-amber-400" />
                <span>{listing.rating}</span>
            </div>

            {/* 距离 */}
            <div className="flex items-center">
                <MapPin />
                {listing.distanceMeters > 1000
                    ? `${(listing.distanceMeters / 1000).toFixed(1)} km 外`
                    : `${Math.round(listing.distanceMeters)} m 外`}
            </div>

            {/* 按钮 */}
            <Button onClick={() => navigate(`/service/${listing.id}`)}>
                详情 / 订购
            </Button>
        </CardContent>
    </Card>
</Popup>
```

---

### 6️⃣ 列表视图功能

#### 移动端设计
```
点击 "查看列表" 按钮后：

┌────────────────────────────────┐
│ ─── (下拉手柄)                  │
│                                │
│ 推荐服务                  [12] │
│                                │
│ ┌────────────────────────────┐ │
│ │ [图]  深度保洁服务          │ │
│ │       专业团队...           │ │
│ │       2.3 km • ⭐ 4.8      │ │
│ └────────────────────────────┘ │
│                                │
│ ┌────────────────────────────┐ │
│ │ [图]  家政服务              │ │
│ │       经验丰富...           │ │
│ │       1.5 km • ⭐ 4.9      │ │
│ └────────────────────────────┘ │
│                                │
│        [🗺️ 返回地图]           │
└────────────────────────────────┘
```

#### 桌面端设计
```
┌──────────────────────────────────────────┐
│         🗺️ 地图主区域                    │
│                                          │
│    ┌───────────────────┐                │
│    │ 推荐服务     [12] │ ← 浮动侧边栏   │
│    │                   │                │
│    │ [Listing Card]    │                │
│    │ [Listing Card]    │                │
│    │ [Listing Card]    │                │
│    │ ...               │                │
│    └───────────────────┘                │
│                                          │
└──────────────────────────────────────────┘
```

#### 列表卡片结构
```
┌────────────────────────────────────┐
│ [80×80图]  深度保洁服务   [SERVICE] │
│            专业团队，设备齐全...     │
│            2.3 km  ⭐ 4.8          │
└────────────────────────────────────┘
      ↑         ↑            ↑
    缩略图    标题+描述    距离+评分
```

#### 响应式逻辑
```tsx
// 移动端：全屏覆盖
<div className={`
    absolute inset-0
    transition-all duration-500
    ${viewMode === 'LIST'
        ? 'translate-y-0 opacity-100'
        : 'translate-y-full opacity-0'}
    md:translate-y-0 md:opacity-100
`}>
    {/* 列表内容 */}
</div>

// 桌面端：浮动侧边栏
<div className="md:absolute md:top-20 md:right-4 md:w-80">
    {/* 列表内容 */}
</div>
```

---

### 7️⃣ 距离计算显示

#### 功能描述
自动计算并显示每个服务距离用户的实际距离。

#### 计算逻辑
```typescript
// 使用Haversine公式计算地球表面两点间距离
function calculateDistance(
    lat1: number, lng1: number,
    lat2: number, lng2: number
): number {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lng1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // 返回米数
}
```

#### 显示格式
```typescript
// 距离格式化
const formatDistance = (meters: number) => {
    if (meters > 1000) {
        return `${(meters / 1000).toFixed(1)} km 外`;
    } else {
        return `${Math.round(meters)} m 外`;
    }
};

// 示例
formatDistance(500)    // "500 m 外"
formatDistance(1500)   // "1.5 km 外"
formatDistance(12300)  // "12.3 km 外"
```

#### 视觉样式
```tsx
<div className="text-primary bg-primary/10 px-2 py-0.5 rounded-full">
    📍 2.3 km
</div>
```

---

## 1️⃣ 服务半径选择功能

### 功能描述
允许服务提供者在发布服务时设置服务覆盖范围，在地图上可视化显示。

### 使用方法

#### 在发布表单中使用
```tsx
import LocationPicker from "@/components/LocationPicker";

<LocationPicker
    value={location}
    onChange={setLocation}
    showRadiusSelector={true}   // 启用半径选择
    defaultRadius={10}            // 默认10km
/>
```

#### 数据结构
```typescript
interface LocationData {
    lat: number;              // 纬度
    lng: number;              // 经度
    address?: string;         // 地址
    serviceRadiusKm?: number; // 服务半径（公里）
}
```

### 视觉效果
- 🎯 **半径圆圈**：地图上显示绿色虚线圆圈
- 🎚️ **滑块控制**：1-50km范围，快捷按钮（5/10/20/30km）
- 💚 **实时预览**：拖动滑块实时更新地图圆圈

### 数据存储
```typescript
// 存储在 listing_masters.metadata 字段
metadata: {
    serviceRadiusKm: 10
}
```

---

## 2️⃣ 批量地理编码工具

### 功能描述
为已有的listings批量添加地理坐标，使用OpenStreetMap Nominatim API。

### TypeScript 脚本

#### 运行方式
```bash
# 安装tsx (如果没有)
npm install -g tsx

# 运行脚本
npx tsx scripts/batch-geocode-listings.ts
```

#### 功能特性
- ✅ 自动查找缺少坐标的listings
- ✅ 批量地理编码（每秒最多1个请求）
- ✅ 自动更新数据库
- ✅ 进度显示和统计报告
- ✅ 错误处理和重试机制

#### 输出示例
```
🚀 开始批量地理编码...

📍 找到 15 条需要地理编码的记录

[1/15] 处理: Kanata Lakes, Ottawa
✅ [1/15] 成功: (45.3175, -75.9050)

[2/15] 处理: Barrhaven, Ottawa
✅ [2/15] 成功: (45.2728, -75.7366)
...

==================================================
📊 批量地理编码完成！
==================================================
✅ 成功: 13 条
❌ 失败: 2 条
📈 成功率: 86.7%
==================================================
```

### SQL 脚本

#### 使用方式
在 Supabase SQL Editor 中运行 `scripts/batch-geocode-listings.sql`

#### 主要查询
```sql
-- 查询1: 找出缺少坐标的listings
SELECT id, title_zh, location_address
FROM listing_masters
WHERE (latitude IS NULL OR longitude IS NULL)
  AND location_address IS NOT NULL;

-- 查询2: 统计覆盖率
SELECT
    COUNT(*) as total,
    COUNT(latitude) as with_coords,
    ROUND((COUNT(latitude)::numeric / COUNT(*)) * 100, 2) as coverage_pct
FROM listing_masters;

-- 查询6: 生成PostGIS地理类型
UPDATE listing_masters
SET location_coords = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location_coords IS NULL;
```

---

## 3️⃣ 地图标记聚类功能

### 功能描述
当地图上标记密集时，自动合并为聚类标记，提升性能和可读性。

### 组件使用

#### 安装依赖
```bash
npm install leaflet.markercluster
npm install --save-dev @types/leaflet.markercluster
```

#### 基础用法
```tsx
import MarkerCluster from "@/components/map/MarkerCluster";

<MarkerCluster
    markers={markers}
    onMarkerClick={(id) => console.log('Clicked:', id)}
/>
```

#### 标记数据格式
```typescript
interface MarkerData {
    id: string;
    position: [number, number];
    icon: L.DivIcon;
    popup: string | HTMLElement;
}
```

### 聚类配置

#### 默认设置
```typescript
{
    maxClusterRadius: 80,        // 聚类半径80像素
    spiderfyOnMaxZoom: true,     // 最大缩放时展开
    showCoverageOnHover: false,  // 不显示覆盖范围
    disableClusteringAtZoom: 18  // 缩放级别18时禁用
}
```

### 聚类样式

#### 三种尺寸
- 🔵 **小型** (< 10个): 蓝色，40px
- 🟠 **中型** (10-49个): 橙色，50px
- 🔴 **大型** (≥ 50个): 红色，60px

#### 自定义样式
CSS 文件：`components/map/MarkerCluster.css`

```css
.marker-cluster-small div {
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
```

---

## 4️⃣ 路线导航集成

### 功能描述
一键打开第三方导航应用，支持Google Maps、Apple Maps、Waze。

### 工具函数

#### 导入
```typescript
import {
    smartNavigate,
    openGoogleMaps,
    openAppleMaps,
    openWaze,
    getNavigationInfo
} from "@/utils/navigation";
```

#### 智能导航
自动检测设备并选择最佳导航应用：
```typescript
smartNavigate({
    latitude: 45.4215,
    longitude: -75.6972,
    address: "Ottawa City Hall",
    label: "City Hall"
});
```

#### 平台检测
```typescript
// iOS → Apple Maps
// Android → Google Maps
// Desktop → Google Maps
```

### NavigationButton 组件

#### 基础用法
```tsx
import NavigationButton from "@/components/NavigationButton";

<NavigationButton
    latitude={45.4215}
    longitude={-75.6972}
    address="Ottawa City Hall"
    label="City Hall"
    showDropdown={true}
/>
```

#### 下拉菜单功能
- 📍 显示距离和预计时间
- 🗺️ Google Maps选项
- 🍎 Apple Maps选项
- 🚗 Waze选项
- 📝 目的地地址显示

### 距离和时间计算

#### 获取导航信息
```typescript
const navInfo = getNavigationInfo(
    fromLat, fromLng,  // 起点
    toLat, toLng,      // 终点
    'zh'               // 语言
);

// 返回:
{
    distance: {
        meters: 5230,
        formatted: "5.2 公里"
    },
    walkingTime: {
        minutes: 63,
        formatted: "1 小时 3 分钟"
    },
    drivingTime: {
        minutes: 8,
        formatted: "8 分钟"
    }
}
```

#### 工具函数
```typescript
// 计算距离（米）
calculateDistance(lat1, lng1, lat2, lng2)

// 格式化距离
formatDistance(5230, 'zh')  // "5.2 公里"

// 获取步行时间（分钟）
getWalkingTime(5230)  // 63

// 获取驾车时间（分钟）
getDrivingTime(5230)  // 8
```

---

## 5️⃣ 地理围栏提醒功能

### 功能描述
当用户进入或离开服务区域时，自动触发通知或回调。

### useGeofencing Hook

#### 基础用法
```typescript
import { useGeofencing } from "@/hooks/useGeofencing";

const {
    addRegion,
    removeRegion,
    insideRegions,
    currentPosition,
    checkNow
} = useGeofencing({
    enabled: true,
    checkInterval: 30000,        // 30秒检查一次
    showNotifications: true      // 显示Toast通知
});
```

#### 添加地理围栏
```typescript
addRegion({
    id: 'service-area-1',
    latitude: 45.4215,
    longitude: -75.6972,
    radiusMeters: 5000,          // 5公里半径
    name: 'Home Repair Service Area',
    onEnter: (region) => {
        console.log('进入:', region.name);
        // 发送push通知、显示优惠信息等
    },
    onExit: (region) => {
        console.log('离开:', region.name);
    }
});
```

### useServiceAreaMonitor Hook

#### 简化版 - 单个服务区域
```typescript
import { useServiceAreaMonitor } from "@/hooks/useGeofencing";

const { isInArea, distance } = useServiceAreaMonitor(
    45.4215,      // 服务位置纬度
    -75.6972,     // 服务位置经度
    10,           // 半径（km）
    'Plumbing Service'
);

// 根据状态显示UI
{isInArea && (
    <Badge variant="success">
        ✅ 您在服务范围内
    </Badge>
)}
```

### 应用场景

#### 1. 附近服务推荐
```typescript
useEffect(() => {
    listings.forEach(listing => {
        addRegion({
            id: listing.id,
            latitude: listing.latitude,
            longitude: listing.longitude,
            radiusMeters: listing.metadata.serviceRadiusKm * 1000,
            name: listing.titleZh,
            onEnter: (region) => {
                toast.success('发现附近服务！', {
                    description: region.name,
                    action: {
                        label: '查看',
                        onClick: () => navigate(`/service/${region.id}`)
                    }
                });
            }
        });
    });
}, [listings]);
```

#### 2. 自动签到
```typescript
addRegion({
    id: 'store-checkin',
    latitude: storeLocation.lat,
    longitude: storeLocation.lng,
    radiusMeters: 50,  // 50米内
    name: '商家店铺',
    onEnter: async (region) => {
        // 自动签到
        await checkIn(region.id);
        toast.success('签到成功！获得10积分');
    }
});
```

#### 3. 服务区域验证
```typescript
// 在下单前验证用户是否在服务范围内
const { isInArea, distance } = useServiceAreaMonitor(
    listing.latitude,
    listing.longitude,
    listing.metadata.serviceRadiusKm
);

const handleOrder = () => {
    if (!isInArea) {
        toast.error('您不在服务范围内', {
            description: `您距离服务区域还有 ${formatDistance(distance)}`
        });
        return;
    }
    // 继续下单...
};
```

---

## 🎯 完整使用示例

### 场景：服务详情页集成所有功能

```tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import NavigationButton from '@/components/NavigationButton';
import { useServiceAreaMonitor } from '@/hooks/useGeofencing';
import { formatDistance } from '@/utils/navigation';

const ServiceDetail = () => {
    const { id } = useParams();
    const [listing, setListing] = useState(null);

    // 1. 获取服务信息
    useEffect(() => {
        // 加载listing数据...
    }, [id]);

    // 2. 地理围栏监控
    const { isInArea, distance } = useServiceAreaMonitor(
        listing?.latitude,
        listing?.longitude,
        listing?.metadata?.serviceRadiusKm || 10,
        listing?.titleZh
    );

    if (!listing) return <Loading />;

    return (
        <div className="service-detail">
            {/* 基本信息 */}
            <h1>{listing.titleZh}</h1>
            <p>{listing.descriptionZh}</p>

            {/* 位置信息 */}
            <div className="location-info">
                <MapPin className="w-5 h-5" />
                <span>{listing.location.fullAddress}</span>

                {/* 服务范围徽章 */}
                {listing.metadata.serviceRadiusKm && (
                    <Badge variant="outline">
                        服务范围: {listing.metadata.serviceRadiusKm} km
                    </Badge>
                )}
            </div>

            {/* 区域状态提示 */}
            {isInArea ? (
                <Alert variant="success">
                    ✅ 您在服务范围内！现在下单可享受快速响应
                </Alert>
            ) : (
                <Alert variant="warning">
                    ⚠️ 您距离服务区域还有 {formatDistance(distance, 'zh')}
                </Alert>
            )}

            {/* 导航按钮 */}
            <NavigationButton
                latitude={listing.latitude}
                longitude={listing.longitude}
                address={listing.location.fullAddress}
                label={listing.titleZh}
                showDropdown={true}
            />

            {/* 地图预览 */}
            <MapContainer center={[listing.latitude, listing.longitude]} zoom={14}>
                <Marker position={[listing.latitude, listing.longitude]} />
                {listing.metadata.serviceRadiusKm && (
                    <Circle
                        center={[listing.latitude, listing.longitude]}
                        radius={listing.metadata.serviceRadiusKm * 1000}
                        pathOptions={{ color: '#10b981', fillOpacity: 0.1 }}
                    />
                )}
            </MapContainer>

            {/* 下单按钮 */}
            <Button
                onClick={handleOrder}
                disabled={!isInArea}
            >
                {isInArea ? '立即预约' : '不在服务范围内'}
            </Button>
        </div>
    );
};
```

---

## 📦 所需依赖

### NPM 包
```bash
# 地图相关
npm install react-leaflet leaflet

# 标记聚类
npm install leaflet.markercluster
npm install --save-dev @types/leaflet.markercluster

# Supabase客户端
npm install @supabase/supabase-js

# UI组件（如果还没安装）
npm install sonner
```

### TypeScript 配置
确保 `tsconfig.json` 包含：
```json
{
    "compilerOptions": {
        "types": ["leaflet", "leaflet.markercluster"]
    }
}
```

---

## 🔧 环境变量

确保 `.env` 文件包含：
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 📊 性能优化建议

### 1. 地理围栏
- ✅ 使用合理的检查间隔（推荐30-60秒）
- ✅ 限制同时监控的区域数量（建议<10个）
- ✅ 在组件卸载时清理监听

### 2. 地图标记
- ✅ 使用聚类功能（>50个标记时）
- ✅ 懒加载地图组件
- ✅ 限制初始加载的标记数量

### 3. 批量地理编码
- ✅ 遵守API速率限制（1req/s）
- ✅ 分批处理大量数据
- ✅ 缓存地理编码结果

---

## 🐛 常见问题

### Q1: 地理编码失败
**A:** 检查地址格式，确保包含城市/国家信息。使用更具体的地址。

### Q2: 地理围栏不工作
**A:** 检查位置权限，确保用户已授权。检查浏览器兼容性（需要HTTPS）。

### Q3: 导航按钮无响应
**A:** 检查目标坐标是否有效，确保网络连接正常。

### Q4: 聚类标记不显示
**A:** 确保已安装`leaflet.markercluster`依赖，导入CSS文件。

---

## 📚 相关文档

- [Leaflet Documentation](https://leafletjs.com/)
- [OpenStreetMap Nominatim](https://nominatim.org/release-docs/latest/)
- [Google Maps URLs](https://developers.google.com/maps/documentation/urls)
- [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API)

---

**最后更新**: 2026-01-30
**维护者**: Claude Code AI Assistant
