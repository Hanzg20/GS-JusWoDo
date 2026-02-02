# 🚀 地图功能快速开始

5分钟快速集成地图高级功能到您的页面。

---

## ⚡ 1. 添加服务半径选择（发布页面）

```tsx
import LocationPicker from "@/components/LocationPicker";

const [location, setLocation] = useState(null);

<LocationPicker
    value={location}
    onChange={setLocation}
    showRadiusSelector={true}  // 启用半径选择
    defaultRadius={10}          // 默认10km
/>
```

**效果**：地图上显示可调节的服务范围圆圈 🎯

---

## ⚡ 2. 添加导航按钮（服务详情页）

```tsx
import NavigationButton from "@/components/NavigationButton";

<NavigationButton
    latitude={listing.latitude}
    longitude={listing.longitude}
    address={listing.location.fullAddress}
    label={listing.titleZh}
/>
```

**效果**：一键打开Google Maps/Apple Maps/Waze导航 🗺️

---

## ⚡ 3. 监控服务区域（任意页面）

```tsx
import { useServiceAreaMonitor } from "@/hooks/useGeofencing";

const { isInArea, distance } = useServiceAreaMonitor(
    listing.latitude,
    listing.longitude,
    10,  // 10km半径
    listing.titleZh
);

// 根据状态显示UI
{isInArea ? (
    <Badge>✅ 您在服务范围内</Badge>
) : (
    <Alert>⚠️ 距离: {formatDistance(distance)}</Alert>
)}
```

**效果**：实时显示用户是否在服务区域内 📍

---

## ⚡ 4. 添加地图标记聚类（地图页面）

```bash
# 1. 安装依赖
npm install leaflet.markercluster

# 2. 使用组件
```

```tsx
import MarkerCluster from "@/components/map/MarkerCluster";
import "@/components/map/MarkerCluster.css";

<MapContainer>
    <MarkerCluster
        markers={markers}
        onMarkerClick={(id) => navigate(`/service/${id}`)}
    />
</MapContainer>
```

**效果**：密集标记自动聚类，提升性能 🔵

---

## ⚡ 5. 批量地理编码（一次性任务）

```bash
# 为现有listings批量添加坐标
npx tsx scripts/batch-geocode-listings.ts
```

**效果**：自动为所有listings添加经纬度 📍

---

## 🎯 完整示例：改造服务详情页

### Before (基础版本)
```tsx
const ServiceDetail = () => {
    return (
        <div>
            <h1>{listing.title}</h1>
            <p>{listing.address}</p>
            <Button>预约</Button>
        </div>
    );
};
```

### After (完整功能)
```tsx
import NavigationButton from "@/components/NavigationButton";
import { useServiceAreaMonitor } from "@/hooks/useGeofencing";
import { formatDistance } from "@/utils/navigation";

const ServiceDetail = () => {
    const { isInArea, distance } = useServiceAreaMonitor(
        listing.latitude,
        listing.longitude,
        listing.metadata.serviceRadiusKm || 10
    );

    return (
        <div>
            <h1>{listing.title}</h1>

            {/* 区域状态 */}
            {isInArea ? (
                <Alert>✅ 您在服务范围内</Alert>
            ) : (
                <Alert>⚠️ 距离: {formatDistance(distance)}</Alert>
            )}

            {/* 地址和导航 */}
            <div className="flex gap-2">
                <p>{listing.address}</p>
                <NavigationButton
                    latitude={listing.latitude}
                    longitude={listing.longitude}
                    address={listing.address}
                />
            </div>

            {/* 下单按钮 */}
            <Button disabled={!isInArea}>
                {isInArea ? '立即预约' : '不在服务范围内'}
            </Button>
        </div>
    );
};
```

**新增功能**：
- ✅ 实时区域监控
- ✅ 一键导航
- ✅ 智能下单限制

---

## 📦 安装依赖

```bash
npm install leaflet react-leaflet leaflet.markercluster @supabase/supabase-js sonner
```

---

## ⚙️ 配置 (一次性)

### 1. 环境变量 `.env`
```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### 2. 全局CSS `src/index.css`
```css
@import 'leaflet/dist/leaflet.css';
@import 'leaflet.markercluster/dist/MarkerCluster.css';
@import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
```

---

## 🎓 学习路径

1. **第1天**: 添加服务半径选择 (30分钟)
2. **第2天**: 集成导航按钮 (20分钟)
3. **第3天**: 实现地理围栏监控 (40分钟)
4. **第4天**: 添加地图聚类 (45分钟)
5. **第5天**: 运行批量地理编码 (15分钟)

---

## 📚 深入学习

详细文档: [MAP_FEATURES_GUIDE.md](./MAP_FEATURES_GUIDE.md)

---

**准备好了吗？开始集成吧！** 🚀
