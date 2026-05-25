# Anitabi Trip Planner Demo

一个基于 Anitabi 开放 API 的非商业动漫圣地巡礼路线规划网站原型。

## 功能

- 根据用户当前位置和作品集合，规划一日或多日巡礼路线。
- 根据当前位置展示附近最近的动画圣地。
- 将近距离巡礼点自动归纳为“大巡礼点”，并给出访问顺序和段间推荐交通方式。
- 生成路线后地图只显示大巡礼点，点击大巡礼点可查看归纳到其中的小巡礼点。
- 点击路线/附近列表中的巡礼点卡片，或大巡礼点弹窗里的小巡礼点，可在地图上居中并打开详情。
- 巡礼点弹窗展示 Anitabi API 返回的截图缩略图。
- 支持 Bangumi 公开 API 搜索动画条目、加入作品集合，以及手动导入 Bangumi subject ID。
- 支持浏览器定位、地点搜索、地图点击选点和经纬度手动输入来设置当前位置。
- 地图上用不同标记区分出发点、普通巡礼点和已规划路线顺序。
- 地图上显示当前搜索半径范围；半径选择“不限”时不显示范围圈。
- 支持导出 KML 文件，可在 Google My Maps 中作为图层导入。
- 支持分享链接，编码作品 ID、起点、半径、天数、每日点数和路线模式。
- Bangumi 搜索结果会异步显示 Anitabi 是否有巡礼点。
- 支持“只看高密度区域”路线模式，优先规划巡礼点密集的大巡礼点。
- 直接在浏览器中完成位置计算，不上传用户位置到自建服务。
- 保留 Anitabi、截图来源与原链接展示，避免隐藏数据来源。

## 本地运行

这是一个纯静态 demo，直接打开 `index.html` 即可。为避免部分浏览器限制定位权限，也可以用任意静态服务器运行：

```bash
python3 -m http.server 8080
```

然后访问：

```text
http://localhost:8080
```

## 数据与合规边界

本 demo 使用 Anitabi 文档公开的 API：

- `https://api.anitabi.cn/bangumi/{subjectID}/lite`
- `https://api.anitabi.cn/bangumi/{subjectID}/points/detail?haveImage=true`

作品搜索使用 Bangumi 公开 API：

- `POST https://api.bgm.tv/v0/search/subjects?limit=8&offset=0`
- 请求体使用 `keyword` 搜索，并通过 `filter.type: [2]` 限定动画条目。

地点搜索在 demo 中使用 OpenStreetMap Nominatim：

- `GET https://nominatim.openstreetmap.org/search`
- 正式产品应改为自有后端代理或受控地理编码服务，避免浏览器直连公共服务造成限流、识别和使用政策问题。

根据 Anitabi 文档与 App 说明，相关内容遵循 CC BY-NC-SA 4.0：

- 必须署名并保留来源。
- 仅适合非商业用途。
- 基于该内容的改编或整理应以相同协议共享。
- 地标截图可能来自动画、地图或用户投稿等多种来源，正式产品应保留 `origin` 与 `originURL`。

这个仓库只做非商业技术验证。若未来接入广告、会员、佣金、票务、酒店或商业合作，需要先取得 Anitabi 及相关内容权利方的明确授权。

## 正式产品前提

- 需要稳定的作品 ID 映射服务，把 IMDb、Bangumi、AniList 或自定义榜单映射为 Bangumi subject ID。
- 使用 Bangumi API 时应遵守其 User-Agent 建议；纯前端浏览器无法自定义 User-Agent，正式产品更适合通过自有后端代理搜索并做限流。
- 需要缓存层与限流策略，避免浏览器用户直接高频请求 Anitabi。
- Anitabi 公开文档当前只提供按 Bangumi 作品 ID 查询地标；不选作品的全站最近圣地路线需要自有后端维护授权索引或 Anitabi 提供附近地标 API。
- 当前交通方式是基于直线距离的启发式建议；正式产品需要接入真实路径规划、换乘和步行时间。
- 需要路线算法升级，例如接入真实交通时间、营业时间、每日步行距离和用户收藏权重排序。
- 需要更完整的版权与投稿协议设计，尤其是用户新增点位、用户实拍图和动画截图的权利边界。
