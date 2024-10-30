// ==UserScript==
// @name         NCVT Beta
// @version      0.1.1
// @description  NCVT，官网：xianyuhekouchou.me
// @author       NCVT
// @homepage   	 https://www.xianyuhekouchou.me/
// @match        https://static.fifedu.com/*
// @match        https://class.bigdata.ncvt.net/*
// @run-at       document-end
// ==/UserScript==

//fif全局变量
var fif_score = [];
//fif全局变量

//NCVT请求主机
var NcvtIP = "https://class.bigdata.ncvt.net/";

//post请求
function NCVTpost(url, data, succ) {
	$.ajax({
		url: NcvtIP + url,
		type: "post",
		data: data,
		header: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		timeout: 5000,
		success: function(res) {
			succ(res);
		},
		error: function(xhr, type, errorThrown) {
			console.log("出错了");
		},
	});
}

//get请求
function NCVTget(url, data, succ) {
	$.ajax({
		url: NcvtIP + url,
		type: "get",
		data: data,
		dataType: "text/html",
		timeout: 5000,
		success: function(res) {
			succ(res);
		},
		error: function(xhr, type, errorThrown) {
			console.log("出错了");
		},
	});
}

// fif口语功能实现区
function fifedu() {
	(function() {
		const targetURL = "https://moral.fifedu.com/kyxl-app-challenge/evaluation/submitChallengeResults";
		const originalOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function(method, url) {
			// 调用原始的open方法
			this._url = url; // 保存URL供稍后使用
			this._method = method; // 保存方法供稍后使用
			return originalOpen.apply(this, arguments);
		};
		const originalSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function(data) {
			// 拦截向特定URL发送的POST请求
			if (this._method === "POST" && this._url === targetURL) {
				// 尝试修改请求体（string格式）
				if (typeof data === "string") {
					try {
						// 把字符串转换成对象方便操作
						let tmptext = "";
						let tmpjson = {};
						tmptext = decodeURIComponent(data);
						tmptext
							.trim()
							.split("&")
							.forEach((item) => (tmpjson[item.split("=")[0]] = item.split("=")[1]));
						tmpjson.resultJson = JSON.parse(tmpjson.resultJson);
						//分数处理
						tmpjson.resultJson.map((item) => {
							// 发音
							item.accuracy = fif_score[0];
							// 流利度
							item.fluency = fif_score[1];
							// 完整度
							item.complete = fif_score[2];
							// 最终分数
							item.score = fif_score[3];
							//单词细节
							let str = item.ansDetail;
							let newStr = str.replace(/#.*$/, `#${fif_score[4]}`); // 使用正则表达式替换"#"后面的所有内容
							item.ansDetail = newStr;
						});
						//分数处理
						// 将修改好的对象重新转回字符串
						tmptext = "";
						tmptext += "taskId=" + tmpjson.taskId;
						tmptext += "&levelId=" + tmpjson.levelId;
						tmptext += "&studentId=" + tmpjson.studentId;
						tmptext += "&resultJson=" + encodeURIComponent(JSON.stringify(tmpjson.resultJson));
						data = tmptext;
					} catch (e) {
						console.log("出错了");
					}
				}
			}
			// 调用原始的send方法发送请求
			originalSend.call(this, [data]);
		};
	})();
}

// NCVT功能实现区
//变量定义
var allVideos_p = 1;
var allVideos_maxID = null;
var allVideos = [];
//获取所有未入库课程
function getallVideos() {
	NCVTpost("Student/Course/getCoursesCanApply.html", {
		p: allVideos_p,
		maxID: allVideos_maxID,
	}, (succ) => {
		//返回的是字符串，需要转成对象然后操作
		let tmp = JSON.parse(succ);
		//判断是不是第一次获取就已经没有课程了
		if (tmp[1].length === 0 && allVideos_p === 1) {
			return mui.alert("您没有可以入库的课程了", "提示", "确定", function() {}, "div");
		}
		//获取了全部课程后询问用户是否调用入库函数发送入库请求
		if (tmp[1].length === 0) {
			return mui.confirm(`获取完毕，要入库共${allVideos.length}个课程吗？`, "提示", ["取消", "确认"],
				function(e) {
					if (e.index === 1) {
						checkVideos();
					}
				}, "div"
			);
		}
		//将获取到的课程填充到数组内
		tmp[1].map((item) => {
			allVideos.push(item);
		});
		//请求参数改变
		allVideos_maxID = tmp[0];
		allVideos_p++;
		//课程如果没有获取完毕的话就自我调用继续获取
		getallVideos();
	});
}

//变量定义
var allVideos_num = 0;
//入库课程
function checkVideos() {
	allVideos.map((item) => {
		NCVTpost("Student/Course/courseRegister.html", {
			courseID: item.courseID,
		}, (res) => {
			if (res == "1") {
				allVideos_num++;
			}
			if (allVideos_num === allVideos.length) {
				mui.alert("入库完成，稍后将为您刷新页面", "提示", "确定", function(e) {
					if (e.index === 0) {
						location.reload();
					}
				}, "div");
			}
		});
	});
}

//变量定义
var allxxzVideos_p = 1;
var allxxzVideos_maxID = null;
var allxxzVideos = [];
var handler = (event) => {
	stop_allxxzVideos();
};
//变量定义

//获取所有学习中的课程
function getallxxzVideos() {
	NCVTpost("Student/My/myCourse_xxz.html", {
		p: allxxzVideos_p,
		maxRegisterTime: allxxzVideos_maxID,
	}, (succ) => {
		let tmp = JSON.parse(succ);
		if (allxxzVideos_p === 1 && tmp[1].length === 0) {
			return mui.alert("您没有学习中的课程了", "提示", "确定", function(e) {}, "div");
		}
		if (tmp[1].length === 0) {
			mui.confirm(`获取完成，共${allxxzVideos.length}个课程，要开始学习吗？因脚本与页面共存，所以请勿对面进行刷新和回退等操作`, "提示", ["取消", "确认"],
				function(e) {
					if (e.index === 1) {
						start_allxxzVideos();
					}
				}, "div"
			);
			return;
		}
		allxxzVideos_maxID = tmp[0];
		allxxzVideos_p++;
		tmp[1].map((item) => {
			// 二课的所有课程返回有bug,会返回相同的数据,所有有这个应对方法
			const result = allxxzVideos.find(obj => obj['courseID'] == item.courseID);
			if (result != undefined) return
			allxxzVideos.push(item);
		});
		getallxxzVideos();
	});
}

// 开始学习课程
function start_allxxzVideos() {
	//计量器
	let all_arrnum = 0;
	allxxzVideos.map((item) => {
		NCVTpost("Student/Course/getSecondsAndRemmberStartTime.html", {
			courseID: item.courseID,
		}, (succ) => {
			item.remainder = succ;
			all_arrnum++;
			if (all_arrnum === allxxzVideos.length) {
				//按剩余秒数排序
				allxxzVideos.sort((a, b) => {
					return a.remainder - b.remainder;
				});
				//渲染dom
				xxzpages_dom();
				//停止学习按钮监听
				mui("#stop_botton")[0].addEventListener("tap", handler);
			}
		});
	});
}

//dom重新渲染
function xxzpages_dom() {
	mui("#ajaxbox1")[0].innerHTML = "";
	allxxzVideos.map((item) => {
		mui("#ajaxbox1")[0].innerHTML += `<a class="mui-clearfix" id="xxzdom_${item.courseID}">
					<img src="/upload/courseImgs/${item.courseImg}" />
					<h4>${item.courseName}</h4>
					<div class="mui-table">
						<div class="mui-table-view-cell">
							<p>剩余 <span id="remainder_${item.courseID}" style="display: inline; color: #ff0000;">${item.remainder}</span> 秒</p>
						</div>
					</div>
				</a>`;
	});
	xxzvideos_settime();
}

//变量定义
var xxzvideos_time = null;
//变量定义

//计时效果
function xxzvideos_settime() {
	xxzvideos_time = setInterval(() => {
		allxxzVideos.map((item, index) => {
			if (mui(`#remainder_${item.courseID}`)[0].innerHTML == "0") {
				return stop_oncexxzVideos(index);
			}
			let tmp = mui(`#remainder_${item.courseID}`)[0].innerHTML;
			mui(`#remainder_${item.courseID}`)[0].innerHTML = tmp - 1;
		});
	}, 1000);
}

//全部停止学习
function stop_allxxzVideos() {
	//计量器
	let all_arrnum = 0;
	allxxzVideos.map((item, index) => {
		NCVTpost("Student/Course/remmberStudyTime.html", {
			courseID: item.courseID,
			restTime: item.remainder,
		}, (succ) => {
			item.remainder = succ;
			all_arrnum++;
			if (all_arrnum === allxxzVideos.length) {
				clearInterval(xxzvideos_time);
				//停止学习按钮取消监听
				mui("#stop_botton")[0].removeEventListener("tap", handler);
				mui.alert("暂停完成", "提示", "确定", function(e) {}, "div");
			}
		});
	});
}

//单个停止学习
function stop_oncexxzVideos(index) {
	NCVTpost("Student/Course/remmberStudyTime.html", {
		courseID: allxxzVideos[index].courseID,
		restTime: allxxzVideos[index].remainder,
	}, (succ) => {
		mui(`#xxzdom_${allxxzVideos[index].courseID}`)[0].remove();
		mui.toast(`${allxxzVideos[index].courseName} 学习完成`);
		allxxzVideos.splice(index, 1);
	});
}

//变量定义
var allwpjVideos_p = 1;
var allwpjVideos_maxID = null;
var allwpjVideos = [];

//获取未评价评价
function get_allwpjvideos() {
	NCVTpost("Student/My/myCourse_wpj.html", {
		p: allwpjVideos_p,
		maxID: allwpjVideos_maxID,
	}, (succ) => {
		let tmp = JSON.parse(succ);
		if (tmp[1].length === 0 && allwpjVideos_p === 1) {
			return mui.alert("您没有未评价的课程了", "提示", "确定", function(e) {}, "div");
		}
		if (tmp[1].length === 0) {
			mui.confirm(`获取完成，共${allwpjVideos.length}个课程，要开始评价吗？`, "提示", ["取消", "确认"], function(e) {
				if (e.index === 1) {
					finish_allwpjVideos();
				}
			}, "div");
			return;
		}
		allwpjVideos_maxID = tmp[0];
		allwpjVideos_p++;
		tmp[1].map((item) => {
			allwpjVideos.push(item);
		});
		get_allwpjvideos();
	});
}

// 评价课程
function finish_allwpjVideos() {
	let startNum = 0;
	allwpjVideos.map((item, index) => {
		NCVTpost("/Student/Course/comment.html", {
			courseID: item.courseID,
			stars: 5,
			commentStr: "很好",
		}, (succ) => {
			startNum++;
			if (startNum === allwpjVideos.length) {
				mui.alert("评价完成，若在学习中请先暂停学习再刷新页面查看结果", "提示", "确定", function(e) {}, "div");
				allwpjVideos = [];
				allwpjVideos_p = 1;
				allwpjVideos_maxID = null;
				return;
			}
		});
	});
}

//总结提交函数
function submit_apply_func() {
	let button_box = mui(".mui-content-padded")[1];
	button_box.innerHTML = `
	<div id="submit_apply_box" style="display: flex;width: 100%;justify-content: space-between;align-items: center;">
		<button type="button" class="mui-btn mui-btn-primary" id="submit_apply1">重新提交总结</button>
		<button type="button" class="mui-btn mui-btn-primary" id="submit_apply2">查看已报名人员</button>
	</div>
	`;
	mui("#submit_apply_box").on("tap", ".mui-btn-primary", function() {
		//获取id
		let id = this.getAttribute("id");
		// 获取当前页面的URL对象
		const url = new URL(window.location.href);
		// 使用URLSearchParams获取参数值
		const paramValue = url.searchParams.get("activityID");
		if (id === "submit_apply1") {
			window.open(
				`https://class.bigdata.ncvt.net/Student/My/myActivitySummary.html?activityID=${paramValue}&retUrl=JTJGU3R1ZGVudCUyRk15JTJGaW5kZXguaHRtbA==`
			);
		} else if (id === "submit_apply2") {
			window.open(
				`https://class.bigdata.ncvt.net/Student/My/activityQuery.html?activityID=${paramValue}`);
		}
	});
}

//工具函数激活向导
//开始入库课程前置函数
function Ncvt_getallvideo_start() {
	$(document).ready(function() {
		//引入mui文件
		var head = document.getElementsByTagName("head")[0];
		var link = document.createElement("link");
		var script = document.createElement("script");
		link.href = "/Public/web/css/mui.min.css";
		link.rel = "stylesheet";
		link.type = "text/css";
		script.src = "/Public/web/js/mui.min.js";
		script.type = "text/javascript";
		head.appendChild(link);
		head.appendChild(script);
		$(window).load(function() {
			mui.confirm("获取要入库的所有的课程？", "提示", ["取消", "确认"],
				function(e) {
					if (e.index === 1) {
						getallVideos();
					}
				},
				"div"
			);
		});
	});
}

//开始学习课程前置函数
function Ncvt_getxxzvideo_start() {
	mui("#tab4")[0].remove();
	mui(".activmenu")[0].innerHTML += `<a class="mui-control-item">
		<button type="button" class="mui-btn mui-btn-primary" id="stop_botton" style="width: 100%;vertical-align: middle;">停止学习</button>
		</a>`;
	mui("#tab2")[0].innerHTML =
		`<button type="button" class="mui-btn mui-btn-primary" id="finish_botton" style="width: 100%;vertical-align: middle;">未评价</button>`;
	mui("#finish_botton")[0].addEventListener("tap", function() {
		mui.confirm("获取所有未评价课程？", "提示", ["取消", "确认"], function(e) {
			if (e.index === 1) {
				get_allwpjvideos();
			}
		}, "div");
	});
	mui.confirm("获取要学习所有的课程？", "提示", ["取消", "确认"], function(e) {
		if (e.index === 1) {
			getallxxzVideos();
		}
	}, "div");
}

//fif功能前置函数
function fiftool_start() {
	let locationstr = window.location.hash;
	let questionMarkIndex = locationstr.indexOf("?");
	// 如果找到了问号，提取从开始到问号之前的子字符串
	if (questionMarkIndex !== -1) {
		let newStr = locationstr.substring(0, questionMarkIndex);
		if (newStr == "#/dekaronData/dekaronMain") {
			//提示用户输入参数
			let tmpnum = prompt(
				"请输入你要修改成的分数，输入的值为大于0小于100的整数，从左到右依次为：发音、流利度、完整度、最终分数、单词细节分数，用一个空格间隔开"
			);
			if (tmpnum != null) {
				let str = tmpnum;
				let arr = str.split(" ");
				//再判断输入数据是否为整数且大于0小于100
				arr.map((item, index) => {
					if (Number(item) < 0) return
					if (Number(item) > 100) return
					if (Number(item) % 1 != 0) return
					fif_score.push(item)
				})
				if (fif_score.length === 5) {
					window.alert(
						`发音:${fif_score[0]}、流利度:${fif_score[1]}、完整度:${fif_score[2]}、最终分数:${fif_score[3]}、细节分:${fif_score[4]}`
					);
					return fifedu();
				}
			}
			window.alert("分数不合规，请刷新页面后重新输入，设定分数不成功修改不会生效");
		}
	}
}

// 功能判断,判断浏览器地址栏地址
if (window.location.host == "class.bigdata.ncvt.net") {
	if (window.location.href == "https://class.bigdata.ncvt.net/Student/Course/index.html") {
		Ncvt_getallvideo_start();
	} else if (
		window.location.href == "https://class.bigdata.ncvt.net/Student/My/myCourse.html") {
		Ncvt_getxxzvideo_start();
	}
	const submit_URL = window.location.href;
	const targetPath = "https://class.bigdata.ncvt.net/Student/Activity/apply.html";
	const currentPath = submit_URL.split("?")[0];
	if (currentPath === targetPath) {
		submit_apply_func();
	}
} else if (window.location.host == "static.fifedu.com") {
	fiftool_start();
}