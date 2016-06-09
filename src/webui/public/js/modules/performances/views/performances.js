define(['marionette', 'tpl!./templates/performances.tpl', './performance', '../entities/performance', 'underscore',
        'jquery', 'typeahead', 'jquery-ui'],
    function (Marionette, template, PerformanceView, Performance, _, $) {
        return Marionette.CompositeView.extend({
            template: template,
            childView: PerformanceView,
            childViewContainer: '.app-performances',
            ui: {
                newButton: '.app-new-performance-button',
                tabs: '.app-performance-group-tabs',
                container: '.app-performances'
            },
            events: {
                'click @ui.newButton': 'addNew'
            },
            collectionEvents: {
                'change:path add remove reset': 'updateTabs'
            },
            onRender: function () {
                var self = this;
                var deactivate = function () {
                    $('.app-current-path', self.ui.tabs).removeClass('highlight');
                };
                this.ui.container.droppable({
                    accept: '.app-performance-button',
                    tolerance: 'pointer',
                    hoverClass: 'active',
                    over: function () {
                        $('.app-current-path', self.ui.tabs).addClass('highlight');
                    },
                    deactivate: deactivate,
                    out: deactivate,
                    drop: function (event, ui) {
                        var view = self.children.findByCid(ui.draggable.data('cid'));
                        if (view) {
                            view.model.set('path', self.joinPaths(self.currentPath, view.model.id));
                            view.model.save();
                        }
                        self.updateVisiblePerformances(self.currentPath);
                    }
                });

                this.updateTabs();
            },
            addNew: function () {
                var performance = new Performance({name: 'New performance'});
                performance.set({path: this.joinPaths(this.currentPath, performance.id)});
                this.collection.add(performance);
                this.trigger('new', performance);
            },
            attachHtml: function (collectionView, childView) {
                var self = this;

                // add performance to the queue on click
                childView.on('click', function (data) {
                    self.options.queueView.addPerformance(data.model);
                });

                this.ui.newButton.before(childView.el);

                // hiding if not from current directory
                if (this.getParentPath(childView.model.get('path')) != this.currentPath)
                    childView.$el.hide();
            },
            currentPath: '',
            createdDirs: [],
            updateTabs: function () {
                var self = this,
                    paths = _.compact(_.uniq(this.collection.pluck('path'))),
                    dirs = [];

                // create a list of all directories
                _.each(paths, function (path, i) {
                    path = path.split('/').slice(0, -1);
                    for (var i = 0; i < path.length; i++)
                        dirs.push(path.slice(0, i + 1).join('/'));
                });
                dirs = _.uniq(_.union(dirs, this.createdDirs));

                var depth = (this.currentPath == '') ? 0 : this.currentPath.split('/').length,
                    currentDirs = _.filter(dirs, function (dir) {
                        // filtering only dirs in current directory
                        dir = dir.split('/');
                        return dir.length == depth + 1 && dir.slice(0, -1).join('/') == self.currentPath;
                    });

                // clear tabs
                this.ui.tabs.html('');
                // adding tab for parent dir if available
                if (depth > 0) this.ui.tabs.append(this.createTab(this.getParentPath(this.currentPath), '..'));

                _.each(currentDirs, function (dir) {
                    self.ui.tabs.append(self.createTab(dir));
                });

                var addNewTab = self.createTab(this.currentPath, $('<span>').addClass('glyphicon glyphicon-plus')
                    .attr('aria-hidden', 'true'), true);

                addNewTab.click(function (e, ui) {
                    var input = $('<input>').addClass('form-control input-sm'),
                        newTab = $('<li>').addClass('app-new-dir').html(input);
                    input.focusout(function () {
                        var dir = $(this).val();
                        if (dir) {
                            self.createdDirs.push(self.joinPaths(self.currentPath, dir));
                            self.updateTabs();
                        }
                        newTab.remove();
                    });
                    $(this).before(newTab);
                    input.focus();
                });

                self.ui.tabs.append(addNewTab);

                this.ui.tabs.append(
                    this.createTab(this.currentPath, '/' + this.currentPath, true).addClass('app-current-path active'));
            },
            createTab: function (dir, content, disableEvents) {
                var self = this;

                if (!content) {
                    content = dir.split('/');
                    content = content[content.length - 1];
                }

                var timeout = null,
                    el = $('<a>').attr('href', 'javascript:void(0)').html(content);

                if (!disableEvents)
                    el.click(function () {
                        self.switchDir(dir);
                    }).droppable({
                        accept: '.app-performance-button',
                        tolerance: 'pointer',
                        over: function () {
                            $(this).parent().addClass('active');
                            timeout = setTimeout(function () {
                                self.switchDir(dir);
                            }, 600);
                        },
                        out: function () {
                            $(this).parent().removeClass('active');
                            clearTimeout(timeout);
                        }
                    });

                return $('<li>').attr('data-path', dir).append(el);
            },
            switchDir: function (dir) {
                this.updateVisiblePerformances(dir);
                this.currentPath = dir;
                this.updateTabs();
            },
            updateVisiblePerformances: function (dir) {
                $('.app-performance-button:not(.ui-draggable-dragging)', this.$el).hide().filter('[data-path="' + dir + '"]').fadeIn();
            },
            joinPaths: function (path1, path2) {
                return _.compact(_.union((path1 || '').split('/'), (path2 || '').split('/'))).join('/');
            },
            getParentPath: function (path) {
                return _.compact((path || '').split('/').slice(0, -1)).join('/');
            }
        });
    });
