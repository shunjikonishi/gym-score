package controllers

import play.api._
import play.api.mvc._

import java.io.File
import jp.co.flect.io.FileUtils

object Application extends Controller {

  def index = Action {
    Ok(views.html.index())
  }
  
  def score(gender: String) = Action { request =>
    val dataFile = request.getQueryString("data");
    val dataUrl = request.getQueryString("dataUrl");
    val showIndex = dataUrl.isEmpty;
    val showData = dataFile.isEmpty && dataUrl.isEmpty;
    
    val file = new File(dataFile match {
		case Some(x) =>
			"public/data/" + gender + "/" + x;
		case None =>
			"public/data/" + gender + "/2013WorldChampionship_Qualification.csv";
	})
	if (file.exists()) {
		val data = FileUtils.readFileAsString(file, "utf-8")
		Ok(views.html.score(gender, data, showIndex, showData))
	} else {
		NotFound("File not found: " + file.getName);
	}
  }

}