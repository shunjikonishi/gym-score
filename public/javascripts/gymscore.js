if (typeof(gymapp) === "undefined") gymapp = {};

gymapp.GymnasticsScore = function(type) {
	var SCORE_COUNT = type == "women" ? 4 : 6,
		gymnasts = [],
		title = "All scores",
		link = null;
	
	function sortGymnasts(array, idx) {
		array.sort(function(g1, g2) {
			var a = idx == "total" ? g1.getTotal() : g1.getScore(idx),
				b = idx == "total" ? g2.getTotal() : g2.getScore(idx);
			if( a < b ) return 1;
			if( a > b ) return -1;
			return 0;
		});
	}
	function sort(idx) {
		sortGymnasts(gymnasts, idx);
	}
	function Gymnast(scoreCount, id, data) {
		//assert data.length >= 2;
		this.id = id;
		this.name = data[0];
		this.team = data[1];
		
		var scores = [];
		for (var i=0; i<scoreCount; i++) {
			var score = 0.0;
			if (data.length >= i+2) {
				score = parseFloat(data[i+2]);
				if (isNaN(score)) {
					score = 0.0;
				}
			}
			scores.push(score);
		}
		function getScore(idx) {
			return scores[idx];
		}
		function getTotal() {
			var ret = 0.0;
			for (var i=0; i<scores.length; i++) {
				ret += scores[i];
			}
			return ret;
		}
		$.extend(this, {
			"getScore" : getScore,
			"getTotal" : getTotal,
			"scoreCount" : scoreCount
		});
	}
	function Team(teamNum, bestNum, scoreNum) {
		var members = [];
		
		function addMember(g) {
			if (members.length < teamNum) {
				members.push(g);
				return true;
			}
			return false;
		}
		function removeMember(g) {
			for (var i=0; i<members.length; i++) {
				if (members[i].id == g.id) {
					members.splice(i, 1);
					return true;
				}
			}
			return false;
		}
		function isMember(g) {
			for (var i=0; i<members.length; i++) {
				if (members[i].id == g.id) {
					return true;
				}
			}
			return false;
		}
		function getMemberCount() { 
			return members.length;
		}
		function getMember(idx) {
			return members[idx];
		}
		function getTotal() {
			var array = [];
			for (var i=0; i<members.length; i++) {
				array.push(members[i]);
			}
			var ret = 0.0;
			for (var i=0; i<scoreNum; i++) {
				sortGymnasts(array, i);
				for (var j=0; j<bestNum; j++) {
					ret += array[j].getScore(i);
				}
			}
			return ret;
		}
		function getAllTotal() {
			var ret = 0.0;
			for (var i=0; i<members.length; i++) {
				ret += members[i].getTotal();
			}
			return ret;
		}
		function isEffectiveScore(scoreIndex, g) {
			var array = [];
			for (var i=0; i<members.length; i++) {
				array.push(members[i]);
			}
			sortGymnasts(array, scoreIndex);
			for (var i=0; i<bestNum; i++) {
				if (g.id == array[i].id) {
					return true;
				}
			}
			return false;
		}
		function sort(idx) {
			sortGymnasts(members, idx);
		}
		function clone() {
			var ret = new Team(teamNum, bestNum, scoreNum);
			for (var i=0; i<members.length; i++) {
				ret.addMember(getMember(i));
			}
			return ret;
		}
		function debugString() {
			var ret = "";
			for (var i=0; i<members.length; i++) {
				ret += getMember(i).name + ", ";
			}
			ret += getTotal().toFixed(3);
			return ret;
		}
		$.extend(this, {
			"addMember" : addMember,
			"removeMember" : removeMember,
			"isMember" : isMember,
			"getMemberCount" : getMemberCount,
			"getMember" : getMember,
			"getAllTotal" : getAllTotal,
			"getTotal" : getTotal,
			"clone" : clone,
			"sort" : sort,
			"isEffectiveScore" : isEffectiveScore,
			"debugString" : debugString
		});
	}
	function clear() {
		gymnasts = [];
		title = "All scores";
		link = null;
	}
	function parse(data) {
		clear();
		var rows = data.split("\n"),
			id = 1;
		for (var i=0; i<rows.length; i++) {
			var row = rows[i];
			if (row.length == 0 || row.charAt(0) == "#") {
				continue;
			}
			var cols = row.split(",");
			if (cols.length >= 2) {
				if (cols[0] == "@title") {
					title = cols[1];
				} else if (cols[0] == "@link") {
					link = cols[1];
				} else {
					gymnasts.push(new Gymnast(SCORE_COUNT, id++, cols));
				}
			}
		}
	}
	function createRow(g, team) {
		var $tr = $("<tr></tr>");
		$tr.append("<td>" + g.name + "</td>");
		$tr.append("<td>" + g.team + "</td>");
		for (var j=0; j<g.scoreCount; j++) {
			var $td = $("<td>" + g.getScore(j).toFixed(3) + "</td>")
			$tr.append($td);
			if (team && team.isEffectiveScore(j, g)) {
				$td.addClass("warning");
			}
		}
		$tr.append("<td>" + g.getTotal().toFixed(3) + "</td>");
		return $tr;
	}
	function buildAll($title, $table) {
		$body = $table.find("tbody");
		$body.empty();
		
		var titleContent = title;
		if (link) {
			titleContent = $("<a target='_blank'>" + title + "</a>");
			titleContent.attr("href", link);
		}
		$title.html(titleContent);
		
		for (var i=0; i<gymnasts.length; i++) {
			$body.append(createRow(gymnasts[i]));
		}
	}
	function buildBest($table, team) {
		$body = $table.find("tbody");
		$body.empty();
		
		for (var i=0; i<team.getMemberCount(); i++) {
			$body.append(createRow(team.getMember(i), team));
		}
		return team;
	}
	function getBestTeam(teamNum, bestNum, calcList) {
		if (calcList) {
			calcList.empty();
		}
		var team = new Team(teamNum, bestNum, SCORE_COUNT);
		for (var i=0; i<Math.min(gymnasts.length, teamNum); i++) {
			team.addMember(gymnasts[i]);
		}
		if (gymnasts.length < teamNum) {
			return team;
		}
		team = doGetBestTeam(team, true, calcList);
		team.sort("total");
		return team;
	}
	function doGetBestTeam(team, calcTieBreak, calcList) {
		if (calcList) {
			var li = $("<li>" + team.debugString() + "</li>");
			calcList.append(li);
		}
		var tieBreaks = [],
			others = [],
			total = team.getTotal();
		for (var i=0; i<gymnasts.length; i++) {
			if (!team.isMember(gymnasts[i])) {
				others.push(gymnasts[i]);
			}
		}
		for (var i=0; i<others.length; i++) {
			var g = others[i];
			for (var j=0; j<team.getMemberCount(); j++) {
				var newTeam = team.clone();
				newTeam.removeMember(team.getMember(j));
				newTeam.addMember(g);
				
				var total2 = newTeam.getTotal();
				if (total2 > total) {
					return doGetBestTeam(newTeam, true, calcList);
				}
				if (total2 == total && calcTieBreak) {
					tieBreaks.push(newTeam);
				}
			}
		}
		if (tieBreaks.length == 0) {
			return team;
		}
		for (var i=0; i<tieBreaks.length; i++) {
			var newTeam2 = doGetBestTeam(tieBreaks[i], false, calcList);
			if (newTeam2.getTotal() > total) {
				return doGetBestTeam(newTeam2, true, calcList);
			}
		}
		tieBreaks.push(team);
		tieBreaks.sort(function(t1, t2) {
			var a = t1.getAllTotal(),
				b = t2.getAllTotal();
			if( a < b ) return 1;
			if( a > b ) return -1;
			return 0;
		});
		return tieBreaks[0];
	}
	
	$.extend(this, {
		"parse" : parse,
		"buildAll" : buildAll,
		"buildBest" : buildBest,
		"getBestTeam" : getBestTeam,
		"sort" : sort
	});
}
